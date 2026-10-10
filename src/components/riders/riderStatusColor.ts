export function getStatusColor(status: string) {
  switch (status) {
    case "available":
      return "bg-green-100 text-green-700";
    case "on_delivery":
      return "bg-blue-100 text-blue-700";
    case "busy":
      return "bg-yellow-100 text-yellow-700";
    case "offline":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}
