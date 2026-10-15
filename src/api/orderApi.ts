// src/api/orderApi.ts — Orders API của NestJS (bắt buộc Bearer, axiosClient tự gắn)
import axiosClient from '@api/axiosClient';

export type OrderStatus = 'PENDING' | 'PAID' | string;

export interface OrderItemDto {
  id: string;
  productId: string;
  quantity: number;
  price: number; // giá SNAPSHOT lúc đặt
  name?: string;
  image?: string | null;
}

export interface OrderDto {
  id: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
  items: OrderItemDto[];
}

export const fetchMyOrders = async () => (await axiosClient.get<OrderDto[]>('/api/orders')).data;

export const fetchOrder = async (id: string) =>
  (await axiosClient.get<OrderDto>(`/api/orders/${encodeURIComponent(id)}`)).data;

export const payOrder = async (id: string) =>
  (await axiosClient.post<OrderDto>(`/api/orders/${encodeURIComponent(id)}/pay`)).data;
