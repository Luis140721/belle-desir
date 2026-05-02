import { CloudinaryStorage } from 'multer-storage-cloudinary'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import cloudinary from './cloudinary'
import { env } from './env'

const hasCloudinaryConfig = Boolean(
  env.CLOUDINARY_CLOUD_NAME &&
  env.CLOUDINARY_API_KEY &&
  env.CLOUDINARY_API_SECRET
)

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, _file) => ({
    folder: 'belle-desir/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1200, height: 1200, crop: 'limit', quality: 'auto' }
    ],
    public_id: `product-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  }),
})

const localSiteMediaDir = path.join(process.cwd(), 'uploads', 'site-media')
if (!fs.existsSync(localSiteMediaDir)) {
  fs.mkdirSync(localSiteMediaDir, { recursive: true })
}

const cloudinarySiteMediaStorage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => {
    const isVideo = file.mimetype.startsWith('video/')

    return {
      folder: 'belle-desir/site-media',
      resource_type: isVideo ? 'video' : 'image',
      allowed_formats: isVideo ? ['mp4', 'webm', 'mov'] : ['jpg', 'jpeg', 'png', 'webp'],
      transformation: isVideo
        ? [{ quality: 'auto' }]
        : [{ width: 1800, height: 1200, crop: 'limit', quality: 'auto' }],
      public_id: `site-media-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    }
  },
})

const localSiteMediaStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, localSiteMediaDir)
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname
      .replace(path.extname(file.originalname), '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60)
    cb(null, `site-media-${Date.now()}-${safeName}${path.extname(file.originalname).toLowerCase()}`)
  },
})

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB maximo
})

export const siteMediaUpload = multer({
  storage: hasCloudinaryConfig ? cloudinarySiteMediaStorage : localSiteMediaStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isAllowedImage = /^image\/(jpeg|png|webp)$/.test(file.mimetype)
    const isAllowedVideo = /^video\/(mp4|webm|quicktime)$/.test(file.mimetype)

    if (isAllowedImage || isAllowedVideo) {
      cb(null, true)
      return
    }

    cb(new Error('Formato no permitido. Usa JPG, PNG, WEBP, MP4, WEBM o MOV.'))
  },
})
