import mongoose from 'mongoose';
import { config } from '../src/config/env.js';
import { GroceryProduct } from '../src/modules/food/admin/models/groceryProduct.model.js';
import { AccessoriesProduct } from '../src/modules/accessories/models/accessoriesProduct.model.js';

async function main() {
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to Database.');

    const groceryItem = await GroceryProduct.findOne({ name: 'Green Tea' });
    console.log('Grocery Product [Green Tea]:', groceryItem ? {
        id: groceryItem._id,
        name: groceryItem.name,
        isActive: groceryItem.isActive,
        quantity: groceryItem.quantity,
        stock: groceryItem.stock
    } : 'Not found');

    const accessoryItem = await AccessoriesProduct.findOne({ name: 'Wireless Earbuds' });
    console.log('Accessory Product [Wireless Earbuds]:', accessoryItem ? {
        id: accessoryItem._id,
        name: accessoryItem.name,
        isActive: accessoryItem.isActive,
        quantity: accessoryItem.quantity,
        stock: accessoryItem.stock
    } : 'Not found');

    await mongoose.disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
