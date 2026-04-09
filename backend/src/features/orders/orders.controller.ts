import { Request, Response } from 'express';
import { OrderService } from './orders.service';
import { sendResponse } from '../../shared/utils/response';

export class OrderController {
  static async createOrder(req: Request, res: Response) {
    const result = await OrderService.createOrder(req.user!.id, req.body);
    sendResponse(res, 201, result);
  }

  static async getUserOrders(req: Request, res: Response) {
    const result = await OrderService.getUserOrders(req.user!.id, req.query);
    sendResponse(res, 200, result.data, result.meta);
  }

  static async getOrderById(req: Request, res: Response) {
    const result = await OrderService.getOrderById(req.user!.id, (req.params.id as string), req.user!.role);
    sendResponse(res, 200, result);
  }

  static async getAdminOrders(req: Request, res: Response) {
    const result = await OrderService.getAdminOrders(req.query);
    sendResponse(res, 200, result.data, result.meta);
  }

  static async updateOrderStatus(req: Request, res: Response) {
    const result = await OrderService.updateOrderStatus((req.params.id as string), req.body);
    sendResponse(res, 200, result);
  }
}
