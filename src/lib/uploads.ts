const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 200 * 1024 * 1024;
const MAX_GENERIC_UPLOAD_SIZE = 50 * 1024 * 1024;

const IMAGE_TYPES = new Set([
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/gif",
	"image/avif",
]);

const VIDEO_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm"]);

const GENERIC_TYPES = new Set([...IMAGE_TYPES, ...VIDEO_TYPES]);

export function sanitizeFilename(filename: string): string | null {
	const trimmed = filename.trim();
	if (!trimmed) return null;

	const sanitized = trimmed.replace(/[^A-Za-z0-9._-]/g, "-");
	if (!sanitized || sanitized.startsWith(".")) return null;

	return sanitized.slice(0, 120);
}

export function validateImageFile(file: File): string | null {
	if (!IMAGE_TYPES.has(file.type)) {
		return "Unsupported image type";
	}
	if (file.size <= 0 || file.size > MAX_IMAGE_SIZE) {
		return "Image exceeds size limit";
	}
	return null;
}

export function validateVideoFile(file: File): string | null {
	if (!VIDEO_TYPES.has(file.type)) {
		return "Unsupported video type";
	}
	if (file.size <= 0 || file.size > MAX_VIDEO_SIZE) {
		return "Video exceeds size limit";
	}
	return null;
}

export function validateGenericUpload(
	filename: string,
	contentType: string | null,
	contentLength: string | null,
): string | null {
	if (!sanitizeFilename(filename)) {
		return "Invalid filename";
	}

	if (!contentType || !GENERIC_TYPES.has(contentType)) {
		return "Unsupported file type";
	}

	const size = contentLength ? Number.parseInt(contentLength, 10) : NaN;
	if (!Number.isFinite(size) || size <= 0 || size > MAX_GENERIC_UPLOAD_SIZE) {
		return "Upload exceeds size limit";
	}

	return null;
}
