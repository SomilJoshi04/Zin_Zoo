import mongoose from 'mongoose';

async function run() {
  await mongoose.connect('mongodb+srv://zinzoox99_db_user:zinzoo123@zinzoo.tzwv8he.mongodb.net/zinzoo');
  const FoodItem = mongoose.model('FoodItem', new mongoose.Schema({}, { strict: false, collection: 'food_items' }));
  const foods = await FoodItem.find({ image: { $exists: true, $ne: '' } }).lean();
  console.log('Foods with images:', foods.length);
  if (foods.length > 0) {
    console.log('Sample image URL:', foods[0].image);
  }
  process.exit(0);
}

run();
