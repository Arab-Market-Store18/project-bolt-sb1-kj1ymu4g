import { Button } from "@/components/ui/button";
export const PromoBanner = ({ title, description, buttonText, bgColor = "bg-blue-500" }: any) => (
  <div className="container mx-auto my-8 px-4">
    <div className={`rounded-lg ${bgColor} p-8 text-center text-white`}>
      <h3 className="text-3xl font-bold">{title}</h3>
      <p className="mt-2">{description}</p>
      <Button variant="secondary" size="lg" className="mt-4">
        {buttonText}
      </Button>
    </div>
  </div>
);
