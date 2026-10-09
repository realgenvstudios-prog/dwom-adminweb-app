import { useState, type ChangeEvent, type FormEvent } from "react";
import deliveryService from "../../services/deliveryService";
import type { DeliveryZone } from "../../services/deliveryService";
import ridersService from "../../services/ridersService";

// The create/edit zone form. Split out of the former monolithic
// DeliveryZonesPage. Takes setError/setSuccessMsg/fetchZones from
// useZonesData since a successful save needs to refresh that list and
// surface a message through its banners.
export function useZoneForm(
  setError: (error: string | null) => void,
  setSuccessMsg: (msg: string | null) => void,
  fetchZones: () => Promise<void>,
) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    lat: "",
    lng: "",
    radius: "",
    deliveryFee: "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    // Radius defaults to the "Standard" preset so the slider's displayed
    // value always matches real form state — otherwise a new zone could
    // look like 5km is already chosen when nothing's actually been set yet.
    setFormData({ name: "", lat: "", lng: "", radius: "5", deliveryFee: "" });
    setShowCreateForm(false);
    setEditingZone(null);
    setError(null);
  };

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.lat || !formData.lng || !formData.radius || !formData.deliveryFee) {
      setError("Please fill in all required fields including delivery fee");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await ridersService.createZone({
        name: formData.name,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        radius: parseFloat(formData.radius),
        deliveryFee: parseFloat(formData.deliveryFee),
      });

      setSuccessMsg(`Zone "${formData.name}" created successfully!`);
      resetForm();
      fetchZones();
    } catch (err: any) {
      setError(err.message || "Failed to create zone");
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingZone) return;

    try {
      setSaving(true);
      setError(null);

      await deliveryService.updateZone(editingZone.id, {
        name: formData.name || undefined,
        lat: formData.lat ? parseFloat(formData.lat) : undefined,
        lng: formData.lng ? parseFloat(formData.lng) : undefined,
        radius: formData.radius ? parseFloat(formData.radius) : undefined,
        deliveryFee: formData.deliveryFee ? parseFloat(formData.deliveryFee) : undefined,
      });

      setSuccessMsg(`Zone "${formData.name}" updated successfully!`);
      resetForm();
      fetchZones();
    } catch (err: any) {
      setError(err.message || "Failed to update zone");
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setShowCreateForm(false);
    setFormData({
      name: zone.name,
      lat: zone.lat.toString(),
      lng: zone.lng.toString(),
      radius: zone.radius.toString(),
      deliveryFee: zone.deliveryFee.toString(),
    });
  };

  return {
    showCreateForm,
    setShowCreateForm,
    editingZone,
    formData,
    setFormData,
    saving,
    handleChange,
    resetForm,
    handleCreateSubmit,
    handleEditSubmit,
    startEditing,
  };
}
