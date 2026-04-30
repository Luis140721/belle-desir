import { Request, Response } from 'express';
import { multimediaService } from './multimedia.service.js';
import { createMultimediaSchema, updateMultimediaSchema } from './multimedia.schemas.js';

export const getAllMultimedia = async (req: Request, res: Response) => {
  try {
    const multimedia = await multimediaService.getAll(req.query);
    res.json(multimedia);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMultimediaById = async (req: Request, res: Response) => {
  try {
    const multimedia = await multimediaService.getById(req.params.id);
    if (!multimedia) {
      return res.status(404).json({ message: 'Multimedia not found' });
    }
    res.json(multimedia);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createMultimedia = async (req: Request, res: Response) => {
  try {
    const validatedData = createMultimediaSchema.parse(req.body);
    const multimedia = await multimediaService.create(validatedData);
    res.status(201).json(multimedia);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: error.message });
  }
};

export const updateMultimedia = async (req: Request, res: Response) => {
  try {
    const validatedData = updateMultimediaSchema.parse(req.body);
    const multimedia = await multimediaService.update(req.params.id, validatedData);
    res.json(multimedia);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: error.message });
  }
};

export const deleteMultimedia = async (req: Request, res: Response) => {
  try {
    await multimediaService.delete(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMultimediaByPageAndSection = async (req: Request, res: Response) => {
  try {
    const { page, section } = req.params;
    const multimedia = await multimediaService.getByPageAndSection(page, section);
    res.json(multimedia);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
