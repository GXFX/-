import io
from typing import Optional

import cloudinary
import cloudinary.uploader

from app.config import settings


def init_cloudinary():
    """Initialize Cloudinary with env variables from config.settings"""
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
    )


async def upload_avatar_to_cloudinary(
    file_content: bytes,
    filename: str,
    user_id: str,
) -> Optional[str]:
    """
    Upload avatar to Cloudinary
    
    Args:
        file_content: bytes of the image
        filename: original filename
        user_id: UUID of the user (for folder organization)
    
    Returns:
        Cloudinary URL of uploaded image or None if failed
    """
    try:
        # Create unique folder path per user
        folder = f"{settings.cloudinary_upload_folder}/{user_id}"
        
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            io.BytesIO(file_content),
            folder=folder,
            resource_type="auto",
            public_id="avatar",  # Always use same filename to overwrite old avatar
            overwrite=True,  # Replace previous avatar
            transformation=[
                {"width": 500, "height": 500, "crop": "fill", "gravity": "face"},  # Square crop
                {"quality": "auto"},  # Auto optimize quality
            ],
        )
        
        return result.get("secure_url")
    except Exception as e:
        print(f"Cloudinary upload error: {e}")
        return None


def get_default_avatars() -> list[dict]:
    """
    Get list of default avatars (system templates).

    These use DiceBear (https://www.dicebear.com) — a free avatar
    generation API that renders an SVG avatar on the fly from a
    URL, no image hosting/upload required on our side.
    """
    # Fixed seeds -> always the same 10 avatars for everyone
    seeds = [
        "Aiko", "Bruno", "Chloe", "Dmitri", "Elena",
        "Felix", "Grace", "Hugo", "Ines", "Jasper",
    ]
    return [
        {
            "id": f"avatar_{i+1}",
            "name": f"Avatar {i+1}",
            "url": f"https://api.dicebear.com/9.x/avataaars/svg?seed={seed}&backgroundType=gradientLinear",
        }
        for i, seed in enumerate(seeds)
    ]