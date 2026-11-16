/** @type {import('next').NextConfig} */
export default { distDir: process.env.NEXT_DIST_DIR || ".next", reactStrictMode: true, images: { formats: ["image/avif","image/webp"], qualities: [70, 75, 92] }, serverExternalPackages: ["argon2","pdfkit","pg-boss"] };
