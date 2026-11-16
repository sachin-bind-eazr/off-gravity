#!/bin/sh
# Transcode the teaser. Source is 848x480 so the 1080p/720p outputs are upscales; CRF is tuned to keep files small.
FF=node_modules/ffmpeg-static/ffmpeg.exe; IN=public/know-your-obstacles.mp4; O=public/video
$FF -y -hide_banner -loglevel error -i $IN -vf scale=1920:-2:flags=lanczos -c:v libx264 -crf 29 -preset medium -pix_fmt yuv420p -c:a aac -b:a 112k -movflags +faststart $O/obstacles-1080.mp4
$FF -y -hide_banner -loglevel error -i $IN -vf scale=1280:-2:flags=lanczos -c:v libx264 -crf 29 -preset medium -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart $O/obstacles-720.mp4
$FF -y -hide_banner -loglevel error -i $IN -vf scale=1920:-2:flags=lanczos -c:v libvpx-vp9 -crf 37 -b:v 0 -row-mt 1 -deadline good -cpu-used 5 -tile-columns 2 -c:a libopus -b:a 96k $O/obstacles-1080.webm
echo done > $O/.done
