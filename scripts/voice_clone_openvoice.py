import os
from moviepy.editor import VideoFileClip
from gradio_client import Client

def extract_audio(in_video: str, out_wav: str):
    clip = VideoFileClip(in_video)
    clip.audio.write_audiofile(out_wav)

def clone(space_url: str, ref_wav: str, text: str, out_path: str):
    c = Client(space_url)
    r = c.predict(ref_wav, text, api_name="/predict")
    if isinstance(r, bytes):
        with open(out_path, "wb") as f:
            f.write(r)

def main():
    video = os.getenv("INPUT_VIDEO", "assets/input.mp4")
    ref = os.getenv("REF_VOICE_WAV", "assets/ref.wav")
    outp = os.getenv("OUTPUT_WAV", "public/Audio/newari_story.wav")
    space = os.getenv("OPENVOICE_SPACE_URL", "")
    text = os.getenv("CLONE_TEXT", "Sample educational narration")
    if os.path.exists(video) and not os.path.exists(ref):
        extract_audio(video, ref)
    if space:
        clone(space, ref, text, outp)

if __name__ == "__main__":
    main()