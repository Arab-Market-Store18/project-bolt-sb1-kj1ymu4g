// app/api/sellers/[sellerId]/route.ts
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const sellersFilePath = path.join(process.cwd(), "data", "sellers.json");

async function readSellers() {
  try {
    const data = await fs.readFile(sellersFilePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    console.error("Error reading sellers.json:", error);
    return [];
  }
}

export async function GET(
  request: Request,
  { params }: { params: { sellerId: string } }
) {
  try {
    const { sellerId } = params;
    const sellers = await readSellers();
    const seller = sellers.find((s: any) => s.id === sellerId);

    if (seller) {
      return NextResponse.json(seller, { status: 200 });
    } else {
      return NextResponse.json(
        { message: "Seller not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("API GET Seller Error:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch seller data",
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
