"use client";

import { useState } from "react";

export default function Home() {
  const [shipmentType, setShipmentType] = useState("Single Unit");
  const [outputData, setOutputData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const material = formData.get("materialType") as string;
    const isFragile = material === "Glass" || material === "Electronics";

    const payload = {
      order_details: {
        service_category: formData.get("serviceCategory"),
        material_type: material,
        is_fragile: isFragile,
      },
      measurements: {
        unit_system: formData.get("unitSystem"),
        length: parseFloat(formData.get("length") as string),
        width: parseFloat(formData.get("width") as string),
        height: parseFloat(formData.get("height") as string),
        actual_weight_kg: parseFloat(formData.get("weight") as string),
      },
      packaging: {
        shipment_type: shipmentType,
        quantity: shipmentType === "Multiple Units" ? parseInt(formData.get("quantity") as string) : 1,
        shape: shipmentType === "Multiple Units" ? formData.get("shape") : "Box",
      },
      route: {
        pickup_pincode: formData.get("pickupPincode"),
        delivery_pincode: formData.get("deliveryPincode"),
      },
    };

    try {
      // Connect to your FastAPI backend
      const response = await fetch("http://127.0.0.1:8000/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      setOutputData(data.metrics || data);
    } catch (error) {
      console.error("Error:", error);
      setOutputData({ error: "Failed to connect to backend engine." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Tatvaops Logistics Mapper
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Service Context */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-gray-700">Service Category</label>
              <select name="serviceCategory" className="p-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="Interiors">Interiors</option>
                <option value="Painting">Painting</option>
                <option value="Solar Services">Solar Services</option>
                <option value="Construction">Residential Construction</option>
                <option value="Electrical">Electrical/Plumbing</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-gray-700">Material Type</label>
              <select name="materialType" className="p-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="Solid">Solid / Wood / Metal</option>
                <option value="Glass">Glass / Fragile</option>
                <option value="Liquid">Liquid / Paint</option>
                <option value="Electronics">Electronics</option>
              </select>
            </div>
          </div>

          {/* Section 2: Dimensions & Weight */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-gray-700">Length</label>
              <input name="length" type="number" placeholder="120" required className="p-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-gray-700">Width</label>
              <input name="width" type="number" placeholder="60" required className="p-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-gray-700">Height</label>
              <input name="height" type="number" placeholder="15" required className="p-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-gray-700">Unit</label>
              <select name="unitSystem" className="p-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="CM">CM</option>
                <option value="INCH">INCH</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-700">Actual Weight (per unit in KG)</label>
            <input name="weight" type="number" placeholder="25" required className="p-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          {/* Section 3: Shipment Units */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-700">Shipment Type</label>
            <select 
              name="shipmentType" 
              value={shipmentType}
              onChange={(e) => setShipmentType(e.target.value)}
              className="p-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="Single Unit">Single Unit</option>
              <option value="Multiple Units">Multiple Units</option>
            </select>
          </div>

          {/* Hidden Multiple Unit Options */}
          {shipmentType === "Multiple Units" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-gray-700">Total Quantity</label>
                <input name="quantity" type="number" defaultValue="2" min="1" className="p-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-gray-700">Packaging Shape</label>
                <select name="shape" className="p-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="Box">Standard Box</option>
                  <option value="Cylindrical">Cylindrical / Bucket</option>
                  <option value="Wrapped">Irregular / Wrapped</option>
                </select>
              </div>
            </div>
          )}

          {/* Section 4: Routing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-gray-700">Pickup Pincode</label>
              <input name="pickupPincode" type="text" placeholder="e.g., 560001" required className="p-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-gray-700">Delivery Pincode</label>
              <input name="deliveryPincode" type="text" placeholder="e.g., 560100" required className="p-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {isLoading ? "Calculating Route..." : "Generate Smart Route"}
          </button>
        </form>

        {/* Output Area */}
        {outputData && (
          <div className="mt-8 p-6 bg-gray-100 rounded-xl shadow-inner border border-gray-300">
            <h3 className="text-lg font-bold text-blue-700 mb-4">Engine Response:</h3>
            <pre className="text-sm text-gray-800 overflow-x-auto whitespace-pre-wrap font-mono">
              {JSON.stringify(outputData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}