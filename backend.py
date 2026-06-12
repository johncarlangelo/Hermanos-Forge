import os
import sys
import argparse
import subprocess
import shutil
import json
import yt_dlp

# Force UTF-8 encoding for stdout/stderr to prevent charmap errors on Windows
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# No longer using pydub, relying on yt-dlp postprocessors and direct subprocess calls

def get_ffmpeg_path(explicit_path=None):
    """Get the path to the bundled ffmpeg executable.

    Tries a number of places relative to the running executable. When
    frozen by PyInstaller the `sys.executable` value is used; in dev the
    package source path is used. If nothing is found, falls back to
    the system `ffmpeg` on PATH.
    """
    candidates = []
    seen = set()

    # Prefer an explicit CLI-provided path first (most deterministic)
    try:
        if explicit_path:
            ef = norm_path(explicit_path)
            try:
                exists = os.path.exists(ef)
            except Exception:
                exists = False
            print(f"STATUS:FFMPEG-EXPLICIT-CANDIDATE:{ef} -> {exists}", flush=True)
            if exists:
                print(f"STATUS:FFMPEG-SELECTED:{ef} (explicit)", flush=True)
                return ef
    except Exception:
        pass

    # Respect explicit environment override next (useful when spawned from Electron)
    try:
        env_ff = os.environ.get('FFMPEG_PATH') or os.environ.get('FFMPEG_EXE') or os.environ.get('FFMPEG_BIN')
        if env_ff:
            ef = norm_path(env_ff)
            try:
                exists = os.path.exists(ef)
            except Exception:
                exists = False
            print(f"STATUS:FFMPEG-ENV-CANDIDATE:{ef} -> {exists}", flush=True)
            if exists:
                print(f"STATUS:FFMPEG-SELECTED:{ef} (from ENV)", flush=True)
                return ef
    except Exception:
        pass

    # If Electron passed its resources path, prefer candidates under that layout
    try:
        electron_resources = os.environ.get('ELECTRON_RESOURCES_PATH') or os.environ.get('RESOURCES_PATH') or os.environ.get('APP_RESOURCES')
        if electron_resources:
            add(os.path.join(electron_resources, 'app.asar.unpacked', 'ffmpeg', 'bin', 'ffmpeg.exe'))
            add(os.path.join(electron_resources, 'app.asar.unpacked', 'ffmpeg', 'ffmpeg.exe'))
            add(os.path.join(electron_resources, 'ffmpeg', 'bin', 'ffmpeg.exe'))
            add(os.path.join(electron_resources, 'ffmpeg', 'ffmpeg.exe'))
    except Exception:
        pass

    def norm_path(p):
        try:
            if not p or p in ('ffmpeg', 'ffprobe'):
                return p
            return os.path.normpath(os.path.abspath(p))
        except Exception:
            return p

    def add(p):
        if not p:
            return
        np = norm_path(p)
        if np not in seen:
            seen.add(np)
            candidates.append(np)

    def _find_ffmpeg_by_walk(start_dirs, max_depth=3):
        """Search for ffmpeg executable under a set of start directories with limited depth.

        Returns the first matching absolute path or None.
        """
        try:
            names = ('ffmpeg.exe', 'ffmpeg')
            for start in start_dirs:
                if not start:
                    continue
                start = norm_path(start)
                if not os.path.exists(start):
                    continue
                for dirpath, dirnames, filenames in os.walk(start):
                    # limit recursive depth
                    try:
                        rel = os.path.relpath(dirpath, start)
                        depth = 0 if rel == '.' else rel.count(os.sep) + 1
                    except Exception:
                        depth = 0
                    if depth > max_depth:
                        dirnames[:] = []
                        continue
                    for fn in filenames:
                        if fn.lower() in names:
                            return norm_path(os.path.join(dirpath, fn))
        except Exception:
            pass
        return None

    try:
        if getattr(sys, 'frozen', False):
            # Running from PyInstaller-built exe
            exe_path = norm_path(sys.executable)
            exe_dir = os.path.dirname(exe_path)

            # Preferred explicit candidates for onedir layout:
            # 1) onedir: backend placed in .../app.asar.unpacked/dist_backend/backend/backend.exe
            #    ffmpeg will live at .../app.asar.unpacked/ffmpeg/ffmpeg.exe -> up two levels
            add(os.path.normpath(os.path.join(exe_dir, '..', '..', 'ffmpeg', 'ffmpeg.exe')))
            # 2) fallback: ffmpeg sibling of dist_backend (up one level)
            add(os.path.normpath(os.path.join(exe_dir, '..', 'ffmpeg', 'ffmpeg.exe')))
            # 3) ffmpeg in a folder next to the exe
            add(os.path.normpath(os.path.join(exe_dir, 'ffmpeg', 'ffmpeg.exe')))
            # 4) ffmpeg.exe next to the exe
            add(os.path.normpath(os.path.join(exe_dir, 'ffmpeg.exe')))
            # 5) additional fallback: parent-level ffmpeg folder
            add(os.path.normpath(os.path.join(os.path.dirname(exe_dir), 'ffmpeg', 'ffmpeg.exe')))

            # Walk up a few parents looking for an ffmpeg/ directory (last resort)
            p = exe_dir
            for _ in range(6):
                add(os.path.join(p, 'ffmpeg', 'ffmpeg.exe'))
                p = os.path.dirname(p)
                if not p or p == os.path.dirname(p):
                    break

            # Also consider Electron's installed layout: insert
            # 'resources/app.asar.unpacked' under parent directories.
            p = exe_dir
            for _ in range(6):
                add(os.path.join(p, 'resources', 'app.asar.unpacked', 'ffmpeg', 'ffmpeg.exe'))
                add(os.path.join(p, 'resources', 'ffmpeg', 'ffmpeg.exe'))
                p = os.path.dirname(p)
                if not p or p == os.path.dirname(p):
                    break
        else:
            base_path = os.path.dirname(os.path.abspath(__file__))
            add(os.path.join(base_path, 'ffmpeg', 'ffmpeg.exe'))
            add(os.path.join(base_path, 'ffmpeg', 'bin', 'ffmpeg.exe'))
            add(os.path.join(base_path, 'ffmpeg.exe'))
    except Exception:
        pass

    # Try a limited-depth search under likely install / resources directories
    try:
        roots = []
        if getattr(sys, 'frozen', False):
            try:
                exe_path = norm_path(sys.executable)
                exe_dir = os.path.dirname(exe_path)
                roots.append(exe_dir)
                p = exe_dir
                for _ in range(4):
                    p = os.path.dirname(p)
                    if not p or p == os.path.dirname(p):
                        break
                    roots.append(p)
                # also consider resources folders next to these roots
                extra = []
                for r in list(roots):
                    extra.append(os.path.join(r, 'resources'))
                    extra.append(os.path.join(r, 'resources', 'app.asar.unpacked'))
                roots.extend(extra)
            except Exception:
                pass
        else:
            roots.append(os.path.dirname(os.path.abspath(__file__)))

        found = _find_ffmpeg_by_walk(roots, max_depth=4)
        if found:
            add(found)
    except Exception:
        pass

    # Finally try common names (will use PATH)
    add('ffmpeg')

    # Diagnostic output: print normalized candidates and whether they exist
    try:
        for p in candidates:
            try:
                exists = False
                if p and p not in ('ffmpeg', 'ffprobe'):
                    exists = os.path.exists(p)
            except Exception:
                exists = False
            print(f"STATUS:FFMPEG-CANDIDATE:{p} -> {exists}", flush=True)
    except Exception:
        pass

    # Prefer a concrete file on disk
    for p in candidates:
        try:
            if p and p not in ('ffmpeg', 'ffprobe') and os.path.exists(p):
                print(f"STATUS:FFMPEG-SELECTED:{p}", flush=True)
                return p
        except Exception:
            continue

    # Check for system ffmpeg on PATH
    try:
        sys_ff = shutil.which('ffmpeg')
        if sys_ff:
            sys_ff = norm_path(sys_ff)
            print(f"STATUS:FFMPEG-SELECTED:{sys_ff} (from PATH)", flush=True)
            return sys_ff
    except Exception:
        pass

    # Nothing found; return the generic name so subprocess will try PATH
    print("STATUS:FFMPEG-SELECTED:ffmpeg (using system PATH)", flush=True)
    return 'ffmpeg'


def get_ffprobe_path(ffmpeg_path=None):
    """Locate ffprobe in the same folder as ffmpeg, or fall back to 'ffprobe'.

    If `ffmpeg_path` is an absolute file, prefer `ffprobe.exe` next to it.
    Otherwise try the system `ffprobe` via PATH.
    """
    try:
        if ffmpeg_path and os.path.isabs(ffmpeg_path) and os.path.exists(ffmpeg_path):
            d = os.path.dirname(ffmpeg_path)
            probe = os.path.join(d, 'ffprobe.exe')
            probe = os.path.normpath(os.path.abspath(probe))
            if os.path.exists(probe):
                print(f"STATUS:FFPROBE-SELECTED:{probe}", flush=True)
                return probe
    except Exception:
        pass

    # Try system ffprobe
    try:
        sys_probe = shutil.which('ffprobe')
        if sys_probe:
            sys_probe = os.path.normpath(os.path.abspath(sys_probe))
            print(f"STATUS:FFPROBE-SELECTED:{sys_probe} (from PATH)", flush=True)
            return sys_probe
    except Exception:
        pass

    print("STATUS:FFPROBE-SELECTED:ffprobe (using system PATH)", flush=True)
    return 'ffprobe'

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

def get_available_formats(youtube_url):
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(youtube_url, download=False)
            formats = info.get('formats', [])
            
            video_formats = []
            seen_heights = set()
            
            for f in formats:
                height = f.get('height')
                ext = f.get('ext')
                vcodec = f.get('vcodec')
                
                if height and ext == 'mp4' and vcodec != 'none':
                    if height not in seen_heights:
                        seen_heights.add(height)
                        video_formats.append({
                            'format_id': f['format_id'],
                            'height': height,
                            'resolution': f"{height}p"
                        })
            
            video_formats.sort(key=lambda x: x['height'])
            print(f"FORMATS:{json.dumps(video_formats)}", flush=True)
    except Exception as e:
        print(f"ERROR:Failed to fetch formats: {e}", flush=True)

def download_youtube_as_mp3(youtube_url, output_dir, ffmpeg_path=None):
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
            'ffprobe_location': ffprobe_bin,
        }

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
        print(f"ERROR:{e}", flush=True)

def download_youtube_as_mp4(youtube_url, output_dir, quality=None, ffmpeg_path=None):
    try:
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        if quality:
            format_str = f'bestvideo[height<={quality}][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'
        else:
            format_str = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best'


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
            'ffprobe_location': ffprobe_bin,
            'postprocessors': [{
                'key': 'FFmpegVideoConvertor',
                'preferedformat': 'mp4',
            }],
        }

        print("STATUS:Starting MP4 download...", flush=True)
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(youtube_url, download=True)
            output_file = ydl.prepare_filename(info_dict)
            
            if not output_file.endswith('.mp4'):
                output_file = os.path.splitext(output_file)[0] + '.mp4'

        print(f"SUCCESS:{output_file}", flush=True)
    except Exception as e:
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

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Hermanos Forge Backend")
    parser.add_argument('--action', choices=['get_formats', 'download_mp3', 'download_mp4', 'convert_mp4'], required=True)
    parser.add_argument('--url', help="YouTube URL")
    parser.add_argument('--file', help="Local MP4 file path for conversion")
    parser.add_argument('--outdir', default=os.path.join(os.path.expanduser("~"), "Downloads"), help="Output directory")
    parser.add_argument('--quality', type=int, help="Maximum video height")
    parser.add_argument('--ffmpeg-path', help='Absolute path to ffmpeg executable (overrides detection)')

    args = parser.parse_args()

    if args.action == 'get_formats':
        get_available_formats(args.url)
    elif args.action == 'download_mp3':
        download_youtube_as_mp3(args.url, args.outdir, ffmpeg_path=args.ffmpeg_path)
    elif args.action == 'download_mp4':
        download_youtube_as_mp4(args.url, args.outdir, args.quality, ffmpeg_path=args.ffmpeg_path)
    elif args.action == 'convert_mp4':
        convert_local_mp4_to_mp3(args.file, args.outdir, ffmpeg_path=args.ffmpeg_path)
