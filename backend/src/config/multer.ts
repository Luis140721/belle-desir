import { CloudinaryStorage } from 'multer-storage-cloudinary'
import multer from 'multer'
import cloudinary from './cloudinary'

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'belle-desir/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1200, height: 1200, crop: 'limit', quality: 'auto' }
    ],
    public_id: `product-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  }),
})

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
})
