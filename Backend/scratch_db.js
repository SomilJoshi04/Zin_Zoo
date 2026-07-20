import mongoose from 'mongoose';
import { FoodCategory } from './src/modules/food/admin/models/category.model.js';
import { normalizeCategoryFoodTypeScope } from './src/modules/food/shared/categoryWorkflow.js';

async function test() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/zinzoo', { // guess DB name or use env if possible. Let's just require server.js to use its db connection?
        });
        const doc = new FoodCategory({
            name: "soft drinks",
            type: "drinks",
            status: true,
            foodTypeScope: normalizeCategoryFoodTypeScope(undefined, 'Both'),
        });
        await doc.save();
        console.log("Saved successfully");
    } catch (e) {
        console.error("Save Error:", e.message);
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
test();
