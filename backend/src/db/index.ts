import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI no configurado en .env");
}

mongoose.set("strictQuery", true);

export async function connectDB(): Promise<void> {
  await mongoose.connect(MONGODB_URI as string);
  console.log("MongoDB conectado");
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}

export { mongoose };
