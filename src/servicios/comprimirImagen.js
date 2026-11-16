// 🖼️ reduce una imagen para guardarla en Firestore (cada documento admite como mucho 1 MB)
export function comprimirImagen(archivo, anchoMax = 1400) {
    return new Promise((resolve, reject) => {
      const direccion = URL.createObjectURL(archivo);
      const img = new Image();
  
      img.onload = () => {
        let ancho = Math.min(anchoMax, img.width);
        let calidad = 0.82;
        let resultado = "";
  
        for (let intento = 0; intento < 6; intento++) {
          const escala = ancho / img.width;
          const lienzo = document.createElement("canvas");
          lienzo.width = Math.round(img.width * escala);
          lienzo.height = Math.round(img.height * escala);
          const ctx = lienzo.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, lienzo.width, lienzo.height);
          ctx.drawImage(img, 0, 0, lienzo.width, lienzo.height);
  
          resultado = lienzo.toDataURL("image/webp", calidad);
          if (!resultado.startsWith("data:image/webp")) {
            resultado = lienzo.toDataURL("image/jpeg", calidad);
          }
          if (resultado.length < 900000) break;
          calidad -= 0.1;
          ancho = Math.round(ancho * 0.85);
        }
  
        URL.revokeObjectURL(direccion);
        if (resultado.length < 1000000) resolve(resultado);
        else reject(new Error("La imagen es demasiado grande"));
      };
  
      img.onerror = () => {
        URL.revokeObjectURL(direccion);
        reject(new Error("No se pudo leer la imagen"));
      };
  
      img.src = direccion;
    });
  }