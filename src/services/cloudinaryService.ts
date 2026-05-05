export const subirArchivo = async (archivo: File) => {
  const formData = new FormData();
  formData.append("file", archivo);
  formData.append("upload_preset", "tu_preset"); // Ya configuraste Cloudinary

  const res = await fetch("https://api.cloudinary.com/v1_1/tu_cloud/upload", {
    method: "POST",
    body: formData,
  });
  return res.json();
};