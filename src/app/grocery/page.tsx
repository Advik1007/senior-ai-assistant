import type { Metadata } from "next";
import { GroceryAssistant } from "@/components/grocery/GroceryAssistant";

export const metadata: Metadata = {
  title: "Grocery Assistant · UNK AI",
};

export default async function GroceryPage({
  searchParams,
}: {
  searchParams: Promise<{ sample?: string }>;
}) {
  const { sample } = await searchParams;
  return <GroceryAssistant sample={sample === "1"} />;
}
