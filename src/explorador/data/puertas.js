// 🚪 Dónde está exactamente cada puerta dibujada (para recortar sus hojas y abrirlas).
// Por sala (id del nodo) y por destino (id del hijo). tipo: doble | simple | arco (sin puerta).
// bisagra (solo en las simples): de qué lado gira. forma: arco (parte de arriba redonda) | recta.
// Si una puerta no está aquí, el Explorador la cruza como un arco, usando su zona de pulsar.
const PUERTAS = {
    "constitucion": {
      "titulo-preliminar": { tipo: "doble", forma: "arco", left: "37.40%", top: "88.22%", width: "5.86%", height: "7.94%" },
      "titulo-1": { tipo: "doble", forma: "arco", left: "54.49%", top: "74.87%", width: "6.25%", height: "8.46%" },
      "titulo-2": { tipo: "doble", forma: "arco", left: "39.36%", top: "74.87%", width: "6.15%", height: "8.46%" },
      "titulo-3": { tipo: "doble", forma: "arco", left: "54.49%", top: "60.94%", width: "6.25%", height: "8.85%" },
      "titulo-4": { tipo: "doble", forma: "arco", left: "39.36%", top: "60.94%", width: "6.05%", height: "8.85%" },
      "titulo-5": { tipo: "doble", forma: "arco", left: "54.49%", top: "46.42%", width: "6.25%", height: "9.11%" },
      "titulo-6": { tipo: "doble", forma: "arco", left: "39.36%", top: "46.35%", width: "6.15%", height: "9.18%" },
      "titulo-7": { tipo: "doble", forma: "arco", left: "54.49%", top: "31.32%", width: "6.25%", height: "9.38%" },
      "titulo-8": { tipo: "doble", forma: "arco", left: "39.36%", top: "31.32%", width: "6.25%", height: "9.38%" },
      "titulo-9": { tipo: "doble", forma: "arco", left: "54.49%", top: "17.38%", width: "6.35%", height: "8.59%" },
      "titulo-10": { tipo: "doble", forma: "arco", left: "39.45%", top: "17.45%", width: "6.54%", height: "8.59%" }
    },
    "titulo-preliminar": {
      "articulo-1": { tipo: "doble", forma: "arco", left: "44.24%", top: "19.79%", width: "10.64%", height: "10.29%" },
      "articulo-2": { tipo: "doble", forma: "arco", left: "35.25%", top: "35.61%", width: "10.06%", height: "10.68%" },
      "articulo-3": { tipo: "doble", forma: "arco", left: "55.27%", top: "35.61%", width: "9.86%", height: "10.74%" },
      "articulo-4": { tipo: "doble", forma: "arco", left: "35.55%", top: "51.63%", width: "10.25%", height: "11.00%" },
      "articulo-5": { tipo: "doble", forma: "arco", left: "55.18%", top: "51.89%", width: "9.86%", height: "10.74%" },
      "articulo-6": { tipo: "doble", forma: "arco", left: "32.03%", top: "67.97%", width: "8.50%", height: "11.00%" },
      "articulo-7": { tipo: "doble", forma: "arco", left: "45.90%", top: "67.97%", width: "8.40%", height: "11.00%" },
      "articulo-8": { tipo: "doble", forma: "arco", left: "59.28%", top: "67.97%", width: "8.59%", height: "11.00%" },
      "articulo-9": { tipo: "doble", forma: "arco", left: "44.73%", top: "83.85%", width: "10.16%", height: "11.33%" }
    },
    "titulo-1": {
      "capitulo-1": { tipo: "doble", forma: "arco", left: "43.85%", top: "83.33%", width: "10.84%", height: "11.78%" },
      "capitulo-2": { tipo: "doble", forma: "arco", left: "43.85%", top: "66.34%", width: "10.84%", height: "11.78%" },
      "capitulo-3": { tipo: "doble", forma: "arco", left: "43.85%", top: "48.83%", width: "10.84%", height: "12.37%" },
      "capitulo-4": { tipo: "doble", forma: "arco", left: "43.85%", top: "31.58%", width: "10.84%", height: "11.91%" },
      "capitulo-5": { tipo: "doble", forma: "arco", left: "43.85%", top: "14.78%", width: "10.84%", height: "11.52%" }
    },
    "seccion-1": {
      "articulo-15": { tipo: "doble", forma: "arco", left: "35.64%", top: "24.22%", width: "7.62%", height: "9.83%" },
      "articulo-16": { tipo: "doble", forma: "arco", left: "49.90%", top: "24.02%", width: "7.42%", height: "10.03%" },
      "articulo-17": { tipo: "doble", forma: "arco", left: "63.38%", top: "24.02%", width: "7.42%", height: "10.03%" },
      "articulo-18": { tipo: "doble", forma: "arco", left: "76.95%", top: "24.02%", width: "7.42%", height: "10.03%" },
      "articulo-19": { tipo: "doble", forma: "arco", left: "40.04%", top: "41.08%", width: "7.81%", height: "9.64%" },
      "articulo-20": { tipo: "doble", forma: "arco", left: "58.40%", top: "41.08%", width: "8.01%", height: "9.64%" },
      "articulo-21": { tipo: "doble", forma: "arco", left: "35.45%", top: "57.55%", width: "7.13%", height: "9.24%" },
      "articulo-22": { tipo: "doble", forma: "arco", left: "48.44%", top: "57.55%", width: "7.03%", height: "9.24%" },
      "articulo-23": { tipo: "doble", forma: "arco", left: "61.33%", top: "57.55%", width: "7.32%", height: "9.31%" },
      "articulo-29": { tipo: "doble", forma: "arco", left: "74.61%", top: "57.55%", width: "6.93%", height: "9.24%" },
      "articulo-24": { tipo: "doble", forma: "arco", left: "38.96%", top: "73.31%", width: "7.32%", height: "8.27%" },
      "articulo-25": { tipo: "doble", forma: "arco", left: "52.34%", top: "73.31%", width: "7.32%", height: "8.27%" },
      "articulo-26": { tipo: "doble", forma: "arco", left: "65.72%", top: "73.31%", width: "7.03%", height: "8.27%" },
      "articulo-27": { tipo: "doble", forma: "arco", left: "39.36%", top: "87.83%", width: "6.74%", height: "8.33%" },
      "articulo-28": { tipo: "doble", forma: "arco", left: "55.27%", top: "87.83%", width: "6.74%", height: "8.33%" }
    },
    "seccion-2": {
      "articulo-30": { tipo: "doble", forma: "arco", left: "43.16%", top: "26.30%", width: "9.18%", height: "13.35%" },
      "articulo-31": { tipo: "doble", forma: "arco", left: "63.38%", top: "26.24%", width: "8.89%", height: "13.41%" },
      "articulo-32": { tipo: "doble", forma: "arco", left: "41.41%", top: "50.07%", width: "8.40%", height: "13.48%" },
      "articulo-33": { tipo: "doble", forma: "arco", left: "58.40%", top: "50.07%", width: "8.30%", height: "13.48%" },
      "articulo-34": { tipo: "doble", forma: "arco", left: "74.41%", top: "50.26%", width: "8.20%", height: "13.28%" },
      "articulo-35": { tipo: "doble", forma: "arco", left: "36.91%", top: "74.28%", width: "8.11%", height: "13.54%" },
      "articulo-36": { tipo: "doble", forma: "arco", left: "50.68%", top: "74.48%", width: "7.91%", height: "13.22%" },
      "articulo-37": { tipo: "doble", forma: "arco", left: "64.55%", top: "74.48%", width: "8.01%", height: "13.41%" },
      "articulo-38": { tipo: "doble", forma: "arco", left: "78.52%", top: "74.48%", width: "7.91%", height: "13.41%" }
    },
    "capitulo-3": {
      "articulo-39": { tipo: "doble", forma: "arco", left: "36.91%", top: "23.31%", width: "7.62%", height: "11.20%" },
      "articulo-40": { tipo: "doble", forma: "arco", left: "48.34%", top: "23.31%", width: "7.91%", height: "11.33%" },
      "articulo-41": { tipo: "doble", forma: "arco", left: "59.67%", top: "23.31%", width: "7.52%", height: "11.20%" },
      "articulo-42": { tipo: "doble", forma: "arco", left: "70.70%", top: "23.31%", width: "7.42%", height: "11.20%" },
      "articulo-43": { tipo: "doble", forma: "arco", left: "36.62%", top: "44.73%", width: "7.91%", height: "11.91%" },
      "articulo-44": { tipo: "doble", forma: "arco", left: "48.34%", top: "44.53%", width: "7.91%", height: "11.26%" },
      "articulo-45": { tipo: "doble", forma: "arco", left: "59.67%", top: "44.73%", width: "7.52%", height: "11.91%" },
      "articulo-46": { tipo: "doble", forma: "arco", left: "70.70%", top: "44.73%", width: "7.42%", height: "10.94%" },
      "articulo-47": { tipo: "doble", forma: "arco", left: "36.91%", top: "65.10%", width: "7.62%", height: "9.57%" },
      "articulo-48": { tipo: "doble", forma: "arco", left: "48.34%", top: "65.10%", width: "7.91%", height: "10.03%" },
      "articulo-49": { tipo: "doble", forma: "arco", left: "59.67%", top: "65.10%", width: "7.81%", height: "9.64%" },
      "articulo-50": { tipo: "doble", forma: "arco", left: "70.21%", top: "65.10%", width: "7.78%", height: "9.64%" },
      "articulo-51": { tipo: "doble", forma: "arco", left: "39.16%", top: "82.75%", width: "7.52%", height: "8.53%" },
      "articulo-52": { tipo: "doble", forma: "arco", left: "56.15%", top: "82.94%", width: "7.52%", height: "8.33%" }
    },
    "capitulo-4": {
      "articulo-53": { tipo: "doble", forma: "arco", left: "31.93%", top: "35.03%", width: "10.64%", height: "18.36%" },
      "articulo-54": { tipo: "doble", forma: "arco", left: "56.25%", top: "35.22%", width: "10.64%", height: "18.16%" }
    },
    "capitulo-5": {
      "articulo-55": { tipo: "simple", forma: "arco", left: "40.18%", top: "45.41%", width: "19.06%", height: "32.86%", bisagra: "derecha" }
    },
    "capitulo-1": {
      "articulo-11": { tipo: "simple", bisagra: "izquierda", forma: "arco", left: "18.75%", top: "51.76%", width: "13.54%", height: "39.55%" },
      "articulo-12": { tipo: "simple", bisagra: "izquierda", forma: "arco", left: "42.51%", top: "51.76%", width: "13.35%", height: "39.55%" },
      "articulo-13": { tipo: "simple", bisagra: "izquierda", forma: "arco", left: "66.41%", top: "51.76%", width: "13.54%", height: "39.55%" }
    },
    "capitulo-2": {
      "seccion-1": { tipo: "arco", top: "24.1%", left: "11.3%", width: "19.9%", height: "59.4%" },
      "seccion-2": { tipo: "arco", top: "23.1%", left: "70.3%", width: "18.1%", height: "60.4%" },
      "articulo-14": { tipo: "simple", bisagra: "derecha", forma: "recta", left: "43.20%", top: "37.70%", width: "13.20%", height: "45.00%" }
    }
  };
  
  export default PUERTAS;