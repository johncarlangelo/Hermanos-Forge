import os
import sys
import argparse
import subprocess
import shutil
import json
import yt_dlp
import time

# Force UTF-8 encoding for stdout/stderr to prevent charmap errors on Windows
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# No longer using pydub, relying on yt-dlp postprocessors and direct subprocess calls

AUTH_WALL_PATTERNS = ["sign in", "private video", "confirm your age", "not a bot", "members-only"]

def apply_cookie_opts(ydl_opts, app_data_path):
    # Inject JS challenge solvers for YouTube's recent anti-bot API updates
    ydl_opts['remote_components'] = ['ejs:github']
    ydl_opts['js_runtimes'] = {'node': {}}
    
    if app_data_path:
        cookie_file = os.path.join(app_data_path, 'cookies.txt')
        if os.path.exists(cookie_file):
            ydl_opts['cookiefile'] = cookie_file

def handle_yt_error(e):
    err_str = str(e).lower()
    for pattern in AUTH_WALL_PATTERNS:
        if pattern in err_str:
            print(f"AUTH_ERROR:{e}", flush=True)
            return True
    return False

def extract_cookies(browser, app_data_path):
    if not browser or not app_data_path:
        print("ERROR:Browser or app data path missing", flush=True)
        return

    cookie_file = os.path.join(app_data_path, 'cookies.txt')
    ydl_opts = {
        'cookiesfrombrowser': (browser.lower(), ),
        'cookiefile': cookie_file,
        'quiet': True,
        'no_warnings': True,
    }
    print(f"STATUS:Extracting cookies from {browser}...", flush=True)
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.cookiejar.save(ignore_discard=True, ignore_expires=True)
            print(f"SUCCESS:{cookie_file}", flush=True)
    except Exception as e:
        print(f"ERROR:Extraction failed: {e}", flush=True)

# Monkey-patch subprocess.Popen to always hide console windows on Windows (prevents terminal flash during yt-dlp FFmpeg calls)
if os.name == 'nt':
    _original_popen = subprocess.Popen
    def _patched_popen(*args, **kwargs):
        kwargs['creationflags'] = kwargs.get('creationflags', 0) | 0x08000000
        return _original_popen(*args, **kwargs)
    subprocess.Popen = _patched_popen

def get_ffmpeg_path(explicit_path=None):
    """Get the path to the bundled ffmpeg executable.
    Relies primarily on Electron passing the exact path via CLI args.
    """
    if explicit_path and os.path.exists(explicit_path):
        return explicit_path

    # Fallback only for standalone testing outside of Electron
    return shutil.which('ffmpeg') or 'ffmpeg'

def get_ffprobe_path(ffmpeg_path=None):
    """Locate ffprobe in the same folder as ffmpeg."""
    if ffmpeg_path:
        return os.path.join(os.path.dirname(ffmpeg_path), 'ffprobe.exe')
    return 'ffprobe.exe'

def transcode_to_h264_if_needed(file_path, ffmpeg_bin):
    """Checks if the video is H.264. If not, transcodes it to H.264 inplace."""
    ffprobe_bin = get_ffprobe_path(ffmpeg_bin)
    try:
        if not os.path.exists(file_path):
            return
        
        # Check codec
        cmd = [ffprobe_bin, '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name', '-of', 'default=noprint_wrappers=1:nokey=1', file_path]
        creationflags = 0x08000000 if os.name == 'nt' else 0
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, creationflags=creationflags)
        codec = result.stdout.strip()
        
        if codec and codec.lower() != 'h264':
            print(f"STATUS:Converting {codec} to H.264 for compatibility...", flush=True)
            temp_output = file_path + ".temp.mp4"
            transcode_cmd = [
                ffmpeg_bin, '-y', '-i', file_path,
                '-c:v', 'libx264', '-preset', 'medium', '-crf', '23',
                '-c:a', 'copy',
                temp_output
            ]
            subprocess.run(transcode_cmd, check=True, stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=creationflags)
            os.replace(temp_output, file_path)
    except Exception as e:
        print(f"ERROR:Transcode check failed: {e}", flush=True)

def progress_hook(d):
    """Hook to print progress in a format Electron can easily parse."""
    if d['status'] == 'downloading':
        downloaded = d.get('downloaded_bytes', 0)
        total = d.get('total_bytes', 0)
        if total > 0:
            progress = (downloaded / total) * 100
            print(f"PROGRESS:{progress:.2f}", flush=True)
    elif d['status'] == 'finished':
        print("STATUS:Download complete, processing...", flush=True)

def get_available_formats(youtube_url, app_data_path=None):
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'noplaylist': True,
        'format': 'all',
    }
    apply_cookie_opts(ydl_opts, app_data_path)
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(youtube_url, download=False)
            formats = info.get('formats', [])
            
            video_formats_dict = {}
            
            for f in formats:
                height = f.get('height')
                vcodec = f.get('vcodec')
                
                # Allow any video codec (e.g., webm/vp9 for >1080p), yt-dlp merges to mp4 automatically
                if height and vcodec != 'none' and vcodec is not None:
                    # By overwriting, we keep the last (usually highest quality) format for a given height
                    video_formats_dict[height] = {
                        'format_id': f['format_id'],
                        'height': height,
                        'resolution': f"{height}p"
                    }
            
            video_formats = list(video_formats_dict.values())
            
            video_formats.sort(key=lambda x: x['height'])
            print(f"FORMATS:{json.dumps(video_formats)}", flush=True)
    except Exception as e:
        if not handle_yt_error(e):
            print(f"ERROR:Failed to fetch formats: {e}", flush=True)

def get_metadata(youtube_url, app_data_path=None):
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'noplaylist': True,
        'format': 'all',
    }
    apply_cookie_opts(ydl_opts, app_data_path)
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(youtube_url, download=False)
            formats = info.get('formats', [])
            video_formats_dict = {}
            
            for f in formats:
                height = f.get('height')
                vcodec = f.get('vcodec')
                
                if height and vcodec != 'none' and vcodec is not None:
                    video_formats_dict[height] = {
                        'format_id': f['format_id'],
                        'height': height,
                        'resolution': f"{height}p"
                    }
            
            video_formats = list(video_formats_dict.values())
            
            video_formats.sort(key=lambda x: x['height'])
            
            metadata = {
                'duration': info.get('duration', 0),
                'formats': video_formats,
                'title': info.get('title'),
                'extractor_key': info.get('extractor_key', info.get('extractor', 'Unknown'))
            }
            
            print(f"METADATA:{json.dumps(metadata)}", flush=True)
    except Exception as e:
        if not handle_yt_error(e):
            print(f"ERROR:Failed to fetch metadata: {e}", flush=True)

def inspect_url(youtube_url, app_data_path=None):
    ydl_opts = {
        'extract_flat': True,
        'quiet': True,
        'no_warnings': True,
        'ignoreerrors': True,
    }
    apply_cookie_opts(ydl_opts, app_data_path)
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(youtube_url, download=False, process=False)
            
            result = {
                '_type': info.get('_type', 'video'),
                'id': info.get('id'),
                'title': info.get('title'),
            }
            
            if result['_type'] == 'playlist' or 'entries' in info:
                # Sometimes youtube returns _type: 'playlist' or just has entries
                result['_type'] = 'playlist'
                entries = info.get('entries', [])
                
                # yt-dlp might return a generator, safely convert to list
                if not isinstance(entries, list):
                    entries = list(entries)
                    
                result['entries'] = [
                    {
                        'id': e.get('id'),
                        'url': e.get('url'),
                        'title': e.get('title'),
                        'duration': e.get('duration')
                    } for e in entries if isinstance(e, dict) and (e.get('id') or e.get('url'))
                ]
            
            print(f"INSPECT:{json.dumps(result)}", flush=True)
    except Exception as e:
        if not handle_yt_error(e):
            print(f"ERROR:Failed to inspect url: {e}", flush=True)

def download_youtube_as_mp3(youtube_url, output_dir, ffmpeg_path=None, no_playlist=False, app_data_path=None):
    try:
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        # Ensure bundled ffmpeg/ffprobe are discoverable by yt-dlp and subprocesses
        ffmpeg_bin = get_ffmpeg_path(ffmpeg_path)
        ffprobe_bin = get_ffprobe_path(ffmpeg_bin)
        if os.path.isabs(ffmpeg_bin):
            ff_dir = os.path.dirname(ffmpeg_bin)
            os.environ['PATH'] = ff_dir + os.pathsep + os.environ.get('PATH', '')

        print(f"DEBUG: Using ffmpeg at {ffmpeg_bin}", flush=True)

        # Additional runtime diagnostics: whether ffmpeg is discoverable via PATH
        try:
            which_ffmpeg = shutil.which('ffmpeg')
        except Exception:
            which_ffmpeg = None
        try:
            which_bin = shutil.which(ffmpeg_bin) if ffmpeg_bin else None
        except Exception:
            which_bin = None

        print(f"STATUS:SHUTIL-WHICH-ffmpeg:{which_ffmpeg}", flush=True)
        print(f"STATUS:SHUTIL-WHICH-ffmpeg_bin:{which_bin}", flush=True)

        try:
            if ffmpeg_bin and ffmpeg_bin != 'ffmpeg' and os.path.exists(ffmpeg_bin):
                try:
                    out = subprocess.run([ffmpeg_bin, '-version'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=6)
                    ver = out.stdout.decode('utf-8', errors='replace').split('\n')[0]
                    print(f"STATUS:FFMPEG-VERSION:{ver}", flush=True)
                except Exception as e:
                    print(f"STATUS:FFMPEG-VERSION-ERR:{e}", flush=True)
            else:
                try:
                    out = subprocess.run(['ffmpeg', '-version'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=6)
                    ver = out.stdout.decode('utf-8', errors='replace').split('\n')[0]
                    print(f"STATUS:FFMPEG-VERSION-SYSTEM:{ver}", flush=True)
                except Exception as e:
                    print(f"STATUS:FFMPEG-VERSION-SYSTEM-ERR:{e}", flush=True)
        except Exception:
            pass

        # Additional runtime diagnostics: whether ffmpeg is discoverable via PATH
        try:
            which_ffmpeg = shutil.which('ffmpeg')
        except Exception:
            which_ffmpeg = None
        try:
            which_bin = shutil.which(ffmpeg_bin) if ffmpeg_bin else None
        except Exception:
            which_bin = None

        print(f"STATUS:SHUTIL-WHICH-ffmpeg:{which_ffmpeg}", flush=True)
        print(f"STATUS:SHUTIL-WHICH-ffmpeg_bin:{which_bin}", flush=True)

        # Try to run ffmpeg -version to ensure it's runnable
        try:
            if ffmpeg_bin and ffmpeg_bin != 'ffmpeg' and os.path.exists(ffmpeg_bin):
                try:
                    out = subprocess.run([ffmpeg_bin, '-version'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=6)
                    ver = out.stdout.decode('utf-8', errors='replace').split('\n')[0]
                    print(f"STATUS:FFMPEG-VERSION:{ver}", flush=True)
                except Exception as e:
                    print(f"STATUS:FFMPEG-VERSION-ERR:{e}", flush=True)
            else:
                # test system ffmpeg
                try:
                    out = subprocess.run(['ffmpeg', '-version'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=6)
                    ver = out.stdout.decode('utf-8', errors='replace').split('\n')[0]
                    print(f"STATUS:FFMPEG-VERSION-SYSTEM:{ver}", flush=True)
                except Exception as e:
                    print(f"STATUS:FFMPEG-VERSION-SYSTEM-ERR:{e}", flush=True)
        except Exception:
            pass

        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': os.path.join(output_dir, '%(title)s.%(ext)s'),
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'progress_hooks': [progress_hook],
            'ffmpeg_location': ffmpeg_bin,
            # 'ffprobe_location': ffprobe_bin,
            'noplaylist': no_playlist,
        }
        apply_cookie_opts(ydl_opts, app_data_path)

        print("STATUS:Starting MP3 download...", flush=True)
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(youtube_url, download=True)
            # When using FFmpegExtractAudio, the final file will have the codec's extension (.mp3)
            # We can construct the final filename based on outtmpl, or look at info_dict
            # yt-dlp prepare_filename returns the original downloaded extension filename, 
            # but since we convert it to mp3, we replace the extension.
            base_file = ydl.prepare_filename(info_dict)
            mp3_file = os.path.splitext(base_file)[0] + '.mp3'

        print(f"SUCCESS:{mp3_file}", flush=True)
    except Exception as e:
        if not handle_yt_error(e):
            print(f"ERROR:{e}", flush=True)

def download_youtube_as_mp4(youtube_url, output_dir, quality=None, ffmpeg_path=None, no_playlist=False, app_data_path=None):
    try:
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        if quality:
            format_str = f'bestvideo[height<={quality}][vcodec^=avc1]+bestaudio[ext=m4a]/bestvideo[height<={quality}][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'
        else:
            format_str = 'bestvideo[vcodec^=avc1]+bestaudio[ext=m4a]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best'


        # Ensure bundled ffmpeg/ffprobe are discoverable
        ffmpeg_bin = get_ffmpeg_path(ffmpeg_path)
        ffprobe_bin = get_ffprobe_path(ffmpeg_bin)
        if os.path.isabs(ffmpeg_bin):
            ff_dir = os.path.dirname(ffmpeg_bin)
            os.environ['PATH'] = ff_dir + os.pathsep + os.environ.get('PATH', '')

        print(f"DEBUG: Using ffmpeg at {ffmpeg_bin}", flush=True)

        ydl_opts = {
            'format': format_str,
            'outtmpl': os.path.join(output_dir, '%(title)s.%(ext)s'),
            'merge_output_format': 'mp4',
            'progress_hooks': [progress_hook],
            'ffmpeg_location': ffmpeg_bin,
            # 'ffprobe_location': ffprobe_bin,
            'noplaylist': no_playlist,
            'postprocessors': [{
                'key': 'FFmpegVideoConvertor',
                'preferedformat': 'mp4',
            }],
        }
        apply_cookie_opts(ydl_opts, app_data_path)

        print("STATUS:Starting MP4 download...", flush=True)
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(youtube_url, download=True)
            output_file = ydl.prepare_filename(info_dict)
            
            if not output_file.endswith('.mp4'):
                output_file = os.path.splitext(output_file)[0] + '.mp4'

            transcode_to_h264_if_needed(output_file, ffmpeg_bin)

        print(f"SUCCESS:{output_file}", flush=True)
    except Exception as e:
        if not handle_yt_error(e):
            print(f"ERROR:{e}", flush=True)

def convert_local_mp4_to_mp3(mp4_file_path, output_dir, ffmpeg_path=None):
    try:
        if not os.path.isfile(mp4_file_path):
            print("ERROR:File not found!", flush=True)
            return

        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        mp3_file_name = os.path.splitext(os.path.basename(mp4_file_path))[0] + '.mp3'
        mp3_file_path = os.path.join(output_dir, mp3_file_name)

        if os.path.exists(mp3_file_path):
            print("ERROR:MP3 file already exists!", flush=True)
            return

        print("STATUS:Converting MP4 to MP3...", flush=True)
        
        ffmpeg_bin = get_ffmpeg_path(ffmpeg_path)
        # Ensure ffmpeg dir is on PATH for any child processes
        if os.path.isabs(ffmpeg_bin):
            os.environ['PATH'] = os.path.dirname(ffmpeg_bin) + os.pathsep + os.environ.get('PATH', '')

        # Diagnostics for convert pathway
        try:
            which_ffmpeg = shutil.which('ffmpeg')
        except Exception:
            which_ffmpeg = None
        try:
            which_bin = shutil.which(ffmpeg_bin) if ffmpeg_bin else None
        except Exception:
            which_bin = None
        print(f"STATUS:SHUTIL-WHICH-ffmpeg:{which_ffmpeg}", flush=True)
        print(f"STATUS:SHUTIL-WHICH-ffmpeg_bin:{which_bin}", flush=True)
        try:
            if ffmpeg_bin and ffmpeg_bin != 'ffmpeg' and os.path.exists(ffmpeg_bin):
                try:
                    out = subprocess.run([ffmpeg_bin, '-version'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=6)
                    ver = out.stdout.decode('utf-8', errors='replace').split('\n')[0]
                    print(f"STATUS:FFMPEG-VERSION:{ver}", flush=True)
                except Exception as e:
                    print(f"STATUS:FFMPEG-VERSION-ERR:{e}", flush=True)
            else:
                try:
                    out = subprocess.run(['ffmpeg', '-version'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=6)
                    ver = out.stdout.decode('utf-8', errors='replace').split('\n')[0]
                    print(f"STATUS:FFMPEG-VERSION-SYSTEM:{ver}", flush=True)
                except Exception as e:
                    print(f"STATUS:FFMPEG-VERSION-SYSTEM-ERR:{e}", flush=True)
        except Exception:
            pass

        command = [ffmpeg_bin, '-y', '-i', mp4_file_path, '-q:a', '0', '-map', 'a', mp3_file_path]
        
        # Hide CMD window on Windows
        creationflags = 0
        if os.name == 'nt':
            creationflags = 0x08000000 # CREATE_NO_WINDOW
            
        subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=creationflags)

        print(f"SUCCESS:{mp3_file_path}", flush=True)
    except Exception as e:
        print(f"ERROR:{e}", flush=True)

def stitch_clips_from_urls(urls, output_dir, ffmpeg_path=None, no_stitch=False, app_data_path=None):
    """
    Downloads each URL in order into output_dir, then stitches all
    clips into a single video using ffmpeg's concat filter (unless no_stitch is True).
    """
    try:
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        ffmpeg_bin = get_ffmpeg_path(ffmpeg_path)
        ffprobe_bin = get_ffprobe_path(ffmpeg_bin)
        if os.path.isabs(ffmpeg_bin):
            os.environ['PATH'] = os.path.dirname(ffmpeg_bin) + os.pathsep + os.environ.get('PATH', '')

        clip_paths = []

        for index, url in enumerate(urls):
            print(f"CLIP:{index}:downloading", flush=True)
            try:
                outtmpl = os.path.join(output_dir, "%(title)s.%(ext)s")
                ydl_opts = {
                    'format': 'bestvideo[ext=mp4][vcodec^=avc]+bestaudio[ext=m4a]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best',
                    'outtmpl': outtmpl,
                    'merge_output_format': 'mp4',
                    'ffmpeg_location': ffmpeg_bin,
                    'quiet': True,
                    'no_warnings': True,
                }
                apply_cookie_opts(ydl_opts, app_data_path)
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info_dict = ydl.extract_info(url, download=True)

                clip_file = ydl.prepare_filename(info_dict)
                if not clip_file.endswith('.mp4'):
                    clip_file = os.path.splitext(clip_file)[0] + '.mp4'

                if not os.path.exists(clip_file):
                    raise Exception("File missing after download")

                clip_paths.append(clip_file)
                transcode_to_h264_if_needed(clip_file, ffmpeg_bin)

                title = info_dict.get('title', f"Clip {index + 1}")
                print(f"CLIP:{index}:done:{title}::{clip_file}", flush=True)

            except Exception as e:
                if handle_yt_error(e):
                    print(f"CLIP:{index}:error:Authentication failed", flush=True)
                    return
                print(f"CLIP:{index}:error:{e}", flush=True)
                print(f"ERROR:Clip {index + 1} failed to download: {e}", flush=True)
                return

        if no_stitch:
            print(f"SUCCESS:{output_dir}", flush=True)
            return

        print("STATUS:All clips downloaded. Stitching...", flush=True)

        target_w, target_h, target_fps = 1920, 1080, 30

        cmd = [ffmpeg_bin, '-y']
        for path in clip_paths:
            cmd += ['-i', path]

        filter_chunks = []
        concat_inputs = ''
        for i in range(len(clip_paths)):
            filter_chunks.append(
                f"[{i}:v]scale={target_w}:{target_h}:force_original_aspect_ratio=decrease,"
                f"pad={target_w}:{target_h}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps={target_fps}[v{i}]"
            )
            filter_chunks.append(
                f"[{i}:a]aformat=sample_rates=44100:channel_layouts=stereo[a{i}]"
            )
            concat_inputs += f"[v{i}][a{i}]"

        filter_complex = ';'.join(filter_chunks)
        filter_complex += f";{concat_inputs}concat=n={len(clip_paths)}:v=1:a=1[outv][outa]"

        output_filename = f"stitched_output_{int(time.time())}.mp4"
        final_output = os.path.join(output_dir, output_filename)

        cmd += [
            '-filter_complex', filter_complex,
            '-map', '[outv]', '-map', '[outa]',
            '-c:v', 'libx264', '-preset', 'medium', '-crf', '23',
            '-c:a', 'aac',
            final_output,
        ]

        creationflags = 0x08000000 if os.name == 'nt' else 0
        subprocess.run(
            cmd, check=True,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            creationflags=creationflags,
        )

        print(f"SUCCESS:{final_output}", flush=True)

    except subprocess.CalledProcessError as e:
        print(f"ERROR:Stitching failed: {e}", flush=True)
    except Exception as e:
        print(f"ERROR:{e}", flush=True)

def download_clip(youtube_url, output_dir, start_time, end_time, quality=None, precise_cut=False, ffmpeg_path=None, title_override=None, app_data_path=None):
    try:
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        ffmpeg_bin = get_ffmpeg_path(ffmpeg_path)
        if os.path.isabs(ffmpeg_bin):
            os.environ['PATH'] = os.path.dirname(ffmpeg_bin) + os.pathsep + os.environ.get('PATH', '')

        # Define the clip bounds
        start_time = float(start_time)
        end_time = float(end_time)

        if title_override:
            # title_override handles exact custom names for multi-clips
            outtmpl = os.path.join(output_dir, f"{title_override} [{int(start_time)}s-{int(end_time)}s] ({int(time.time())}).%(ext)s")
        else:
            outtmpl = os.path.join(output_dir, f"%(title)s (%(id)s) [CLIP {int(start_time)}s-{int(end_time)}s] ({int(time.time())}).%(ext)s")

        ydl_opts = {
            'outtmpl': outtmpl,
            'progress_hooks': [progress_hook],
            'ffmpeg_location': ffmpeg_bin,
            'no_warnings': True,
            'download_ranges': yt_dlp.utils.download_range_func(None, [(start_time, end_time)]),
            'merge_output_format': 'mp4',
        }

        if precise_cut:
            # Instead of relying on force_keyframes_at_cuts which can crash certain bundled ffmpeg builds on Windows,
            # we manually force re-encoding of the video during the download phase.
            ydl_opts['external_downloader_args'] = {
                'ffmpeg_o': ['-c:v', 'libx264', '-preset', 'fast', '-c:a', 'aac']
            }

        # Build format string
        # format_id from frontend is an exact format_id from get_metadata
        if quality:
            ydl_opts['format'] = f"{quality}+bestaudio[ext=m4a]/best"
        else:
            ydl_opts['format'] = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best'
            
        apply_cookie_opts(ydl_opts, app_data_path)

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            print("STATUS:Starting clip download...", flush=True)
            info_dict = ydl.extract_info(youtube_url, download=True)
            filename = ydl.prepare_filename(info_dict)
            if not filename.endswith('.mp4'):
                filename = os.path.splitext(filename)[0] + '.mp4'
            print(f"SUCCESS:{filename}", flush=True)

    except Exception as e:
        if not handle_yt_error(e):
            print(f"ERROR:Failed to download clip: {e}", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Hermanos Forge Backend")
    parser.add_argument('--action', choices=['get_formats', 'download_mp3', 'download_mp4', 'convert_mp4', 'stitch_clips', 'inspect_url', 'get_metadata', 'download_clip', 'extract_cookies'], required=True)
    parser.add_argument('--url', help="YouTube URL")
    parser.add_argument('--urls', help="JSON list of clip URLs, in order")
    parser.add_argument('--file', help="Local MP4 file path for conversion")
    parser.add_argument('--outdir', default=os.path.join(os.path.expanduser("~"), "Downloads"), help="Output directory")
    parser.add_argument('--quality', help="Maximum video height or specific format ID")
    parser.add_argument('--start', type=float, help="Start time in seconds")
    parser.add_argument('--end', type=float, help="End time in seconds")
    parser.add_argument('--precise', action='store_true', help="Use precise cutting (re-encodes cuts)")
    parser.add_argument('--title-override', help="Override the output filename base")
    parser.add_argument('--ffmpeg-path', help='Absolute path to ffmpeg executable (overrides detection)')
    parser.add_argument('--no-stitch', action='store_true', help="Download clips without stitching")
    parser.add_argument('--no-playlist', action='store_true', help="Download only single video from a playlist link")
    parser.add_argument('--app-data-path', help="Path to Electron's userData directory")
    parser.add_argument('--browser', help="Browser to extract cookies from")

    args = parser.parse_args()

    if args.action == 'get_formats':
        get_available_formats(args.url, args.app_data_path)
    elif args.action == 'get_metadata':
        get_metadata(args.url, args.app_data_path)
    elif args.action == 'inspect_url':
        inspect_url(args.url, args.app_data_path)
    elif args.action == 'download_mp3':
        download_youtube_as_mp3(args.url, args.outdir, ffmpeg_path=args.ffmpeg_path, no_playlist=args.no_playlist, app_data_path=args.app_data_path)
    elif args.action == 'download_mp4':
        download_youtube_as_mp4(args.url, args.outdir, args.quality, ffmpeg_path=args.ffmpeg_path, no_playlist=args.no_playlist, app_data_path=args.app_data_path)
    elif args.action == 'convert_mp4':
        convert_local_mp4_to_mp3(args.file, args.outdir, ffmpeg_path=args.ffmpeg_path)
    elif args.action == 'download_clip':
        download_clip(args.url, args.outdir, args.start, args.end, quality=args.quality, precise_cut=args.precise, ffmpeg_path=args.ffmpeg_path, title_override=args.title_override, app_data_path=args.app_data_path)
    elif args.action == 'stitch_clips':
        try:
            urls = json.loads(args.urls)
        except Exception:
            urls = []
        stitch_clips_from_urls(urls, args.outdir, ffmpeg_path=args.ffmpeg_path, no_stitch=args.no_stitch, app_data_path=args.app_data_path)
    elif args.action == 'extract_cookies':
        extract_cookies(args.browser, args.app_data_path)
