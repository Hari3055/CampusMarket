import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Upload, Loader2, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

const categories = [
  { id: "textbooks", label: "Textbooks" },
  { id: "electronics", label: "Electronics" },
  { id: "furniture", label: "Furniture" },
  { id: "clothing", label: "Clothing" },
  { id: "tickets", label: "Tickets" },
  { id: "sports", label: "Sports Equipment" },
  { id: "kitchen", label: "Kitchen" },
  { id: "decor", label: "Decor" },
  { id: "other", label: "Other" },
];

const conditions = [
  { id: "new", label: "New" },
  { id: "like_new", label: "Like New" },
  { id: "good", label: "Good" },
  { id: "fair", label: "Fair" },
  { id: "poor", label: "Poor" },
];

const MAX_IMAGES = 6;
const MAX_IMAGE_MB = 8;

export default function ListingForm({ initialData, onSubmit, isSubmitting }) {
  const [formData, setFormData] = useState(
    initialData || {
      title: "",
      description: "",
      price: "",
      category: "",
      condition: "good",
      campus: "",
      location: "",
      images: [],
    }
  );

  const [uploadingImages, setUploadingImages] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const nextErrors = {};

    const trimmedTitle = formData.title.trim();
    if (!trimmedTitle) {
      nextErrors.title = "Title is required.";
    } else if (trimmedTitle.length < 3) {
      nextErrors.title = "Title must be at least 3 characters.";
    } else if (trimmedTitle.length > 120) {
      nextErrors.title = "Title must be under 120 characters.";
    }

    const priceNumber = Number(formData.price);
    if (Number.isNaN(priceNumber)) {
      nextErrors.price = "Price must be a number.";
    } else if (priceNumber < 0) {
      nextErrors.price = "Price cannot be negative.";
    } else if (priceNumber > 100000) {
      nextErrors.price = "Price looks too high for this marketplace.";
    }

    if (!formData.category) {
      nextErrors.category = "Category is required.";
    }

    if (!formData.campus) {
      nextErrors.campus = "Campus is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = MAX_IMAGES - formData.images.length;
    const filesToUpload = files.slice(0, remainingSlots);

    const tooBig = filesToUpload.find(
      (file) => file.size > MAX_IMAGE_MB * 1024 * 1024
    );
    if (tooBig) {
      setErrors((prev) => ({
        ...prev,
        images: `Each image must be under ${MAX_IMAGE_MB}MB.`,
      }));
      return;
    }

    setErrors((prev) => ({ ...prev, images: undefined }));
    setUploadingImages(true);

    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({
          file,
        });
        return file_url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls.filter(Boolean)],
      }));
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      price: Number(formData.price),
      campus: formData.campus,
      category: formData.category,
      condition: formData.condition,
      location: formData.location.trim(),
      images: Array.isArray(formData.images)
        ? formData.images.filter(Boolean)
        : [],
    };

    onSubmit(payload);
  };

  const disableSubmit =
    isSubmitting ||
    !formData.title ||
    !formData.price ||
    !formData.category ||
    !formData.campus;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          placeholder="e.g., Calculus Textbook 9th Edition"
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          required
          className="mt-1.5"
        />
        {errors.title && (
          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.title}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe the item's condition, any defects, why you're selling..."
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={4}
          className="mt-1.5"
        />
      </div>

      {/* Price */}
      <div>
        <Label htmlFor="price">Price (CAD) *</Label>
        <Input
          id="price"
          type="number"
          placeholder="0.00"
          value={formData.price}
          onChange={(e) =>
            setFormData({ ...formData, price: e.target.value })
          }
          required
          min="0"
          step="0.01"
          className="mt-1.5"
        />
        {errors.price && (
          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.price}
          </p>
        )}
      </div>

      {/* Category & Condition */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Category *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) =>
              setFormData({ ...formData, category: value })
            }
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.category}
            </p>
          )}
        </div>
        <div>
          <Label>Condition *</Label>
          <Select
            value={formData.condition}
            onValueChange={(value) =>
              setFormData({ ...formData, condition: value })
            }
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              {conditions.map((cond) => (
                <SelectItem key={cond.id} value={cond.id}>
                  {cond.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Campus */}
      <div>
        <Label>Campus *</Label>
        <Select
          value={formData.campus}
          onValueChange={(value) =>
            setFormData({ ...formData, campus: value })
          }
        >
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder="Select your campus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="abbotsford">Abbotsford Campus</SelectItem>
            <SelectItem value="chilliwack">Chilliwack Campus</SelectItem>
          </SelectContent>
        </Select>
        {errors.campus && (
          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.campus}
          </p>
        )}
      </div>

      {/* Location */}
      <div>
        <Label htmlFor="location">Pickup Location (Optional)</Label>
        <Input
          id="location"
          placeholder="e.g., Building A, Student Union Building, Parking Lot C"
          value={formData.location}
          onChange={(e) =>
            setFormData({ ...formData, location: e.target.value })
          }
          className="mt-1.5"
        />
      </div>

      {/* Images */}
      <div>
        <Label>Photos</Label>
        <div className="mt-2">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {uploadingImages ? (
                <Loader2 className="h-8 w-8 text-gray-400 animate-spin mb-2" />
              ) : (
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
              )}
              <p className="text-sm text-gray-500">
                {uploadingImages
                  ? "Uploading..."
                  : `Click to upload up to ${MAX_IMAGES} images`}
              </p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={uploadingImages || formData.images.length >= MAX_IMAGES}
            />
          </label>
          {errors.images && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.images}
            </p>
          )}

          {formData.images.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-3">
              {formData.images.map((url, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={disableSubmit}
        className="w-full h-12 text-base bg-green-700 hover:bg-green-800 rounded-xl"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Creating...
          </>
        ) : (
          "Create Listing"
        )}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        By posting, you agree to meet on campus in public spaces, avoid sharing
        sensitive personal information, and follow UFV&apos;s student conduct
        and safety guidelines.
      </p>
    </form>
  );
}


