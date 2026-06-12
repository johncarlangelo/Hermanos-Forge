import os
import sys
import argparse
import subprocess
import json
import yt_dlp

# Force UTF-8 encoding for stdout/stderr to prevent charmap errors on Windows
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

from pydub import AudioSegment

def get_ffmpeg_path():
    """Get the path to the bundled ffmpeg executable."""
    if getattr(sys, 'frozen', False):
        # When compiled with PyInstaller, sys.executable is backend.exe
        # electron-builder places it at: resources/app.asar.unpacked/dist_backend/backend.exe
        # ffmpeg is placed at:           resources/app.asar.unpacked/ffmpeg/ffmpeg.exe
        base_path = os.path.dirname(sys.executable)
        parent_path = os.path.dirname(base_path)  # one level up = app.asar.unpacked/
    else:
        base_path = os.path.dirname(os.path.abspath(__file__))
        parent_path = base_path
    
    paths_to_try = [
        os.path.join(parent_path, 'ffmpeg', 'ffmpeg.exe'),   # compiled: sibling dir
        os.path.join(base_path, 'ffmpeg', 'ffmpeg.exe'),     # dev: ./ffmpeg/
        os.path.join(base_path, 'ffmpeg', 'bin', 'ffmpeg.exe'),
        os.path.join(base_path, 'ffmpeg.exe'),
    ]
    
    for p in paths_to_try:
        if os.path.exists(p):
            return p
            
    return 'ffmpeg'  # fallback to system PATH

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

def download_youtube_as_mp3(youtube_url, output_dir):
    try:
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': os.path.join(output_dir, '%(title)s.%(ext)s'),
            'progress_hooks': [progress_hook],
            'ffmpeg_location': get_ffmpeg_path(),
        }

        print("STATUS:Starting MP3 download...", flush=True)
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(youtube_url, download=True)
            audio_file = ydl.prepare_filename(info_dict)

        print("STATUS:Converting to MP3...", flush=True)
        mp3_file = os.path.splitext(audio_file)[0] + '.mp3'
        
        audio = AudioSegment.from_file(audio_file)
        audio.export(mp3_file, format="mp3")

        try:
            os.remove(audio_file)
        except Exception:
            pass

        print(f"SUCCESS:{mp3_file}", flush=True)
    except Exception as e:
        print(f"ERROR:{e}", flush=True)

def download_youtube_as_mp4(youtube_url, output_dir, quality=None):
    try:
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        if quality:
            format_str = f'bestvideo[height<={quality}][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'
        else:
            format_str = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best'

        ydl_opts = {
            'format': format_str,
            'outtmpl': os.path.join(output_dir, '%(title)s.%(ext)s'),
            'merge_output_format': 'mp4',
            'progress_hooks': [progress_hook],
            'ffmpeg_location': get_ffmpeg_path(),
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

def convert_local_mp4_to_mp3(mp4_file_path, output_dir):
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
        
        command = [get_ffmpeg_path(), '-y', '-i', mp4_file_path, '-q:a', '0', '-map', 'a', mp3_file_path]
        subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

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

    args = parser.parse_args()

    if args.action == 'get_formats':
        get_available_formats(args.url)
    elif args.action == 'download_mp3':
        download_youtube_as_mp3(args.url, args.outdir)
    elif args.action == 'download_mp4':
        download_youtube_as_mp4(args.url, args.outdir, args.quality)
    elif args.action == 'convert_mp4':
        convert_local_mp4_to_mp3(args.file, args.outdir)
