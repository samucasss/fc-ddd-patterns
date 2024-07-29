import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import OrderRepositoryInterface from "../../../../domain/checkout/repository/order-repository.interface";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";

export default class OrderRepository implements OrderRepositoryInterface {
  async create(entity: Order): Promise<void> {
    await OrderModel.create(
      {
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total(),
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        include: [{ model: OrderItemModel }],
      }
    );
  }

  async update(entity: Order): Promise<void> {
    await OrderModel.update(
      {
        customer_id: entity.customerId,
        total: entity.total(),
      },
      {
        where: { id: entity.id },
      }
    );

    await OrderItemModel.destroy({
      where: { order_id: entity.id },
    });

    await OrderItemModel.bulkCreate(
      entity.items.map((item) => ({
        order_id: entity.id,
        id: item.id,
        name: item.name,
        price: item.price,
        product_id: item.productId,
        quantity: item.quantity,
      }))
    );
  }

  async find(id: string): Promise<Order> {
    let orderModel;
    try {
      orderModel = await OrderModel.findOne({
        where: { id },
        include: [OrderItemModel],
        rejectOnEmpty: true,
      });
  
    } catch(error) {
      throw Error("Order not found");
    }

    const orderItens: OrderItem[] = orderModel.items.map((item) => {
      return new OrderItem(item.id, item.name, item.price, item.product_id, item.quantity);
    });

    const order = new Order(id, orderModel.customer_id, orderItens);
    return order;
  }

  async findAll(): Promise<Order[]> {
    const orderModels = await OrderModel.findAll({
      include: [OrderItemModel],
    });

    const orders: Order[] = orderModels.map((orderModel) => {
      const orderItens: OrderItem[] = orderModel.items.map((item) => {
        return new OrderItem(item.id, item.name, item.price, item.product_id, item.quantity);
      });

      return new Order(orderModel.id, orderModel.customer_id, orderItens);
    });

    return orders;
  }

}
