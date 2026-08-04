import fotoAnderEgg from "../assets/construye-archivero.png";
import fotoMaryRichmond from "../assets/kit/foto-mary-richmond.png";

const registroPersonajes = {
  "ander-egg": {
    id: "ander-egg",
    nombre: "Ezequiel Ander-Egg",
    foto: fotoAnderEgg,
    desbloqueado: true,
    mensajeBienvenida:
      "¡Hola! Soy Ezequiel Ander-Egg. Me puedes mover a donde quieras, y cada vez que me pinches te contaré algo distinto sobre mí."
  },
  "mary-richmond": {
    id: "mary-richmond",
    nombre: "Mary Richmond",
    foto: fotoMaryRichmond,
    desbloqueado: true,
    mensajeBienvenida:
      "Hola, soy Mary Richmond. Me puedes mover a donde quieras, y cada vez que me pinches te contaré algo distinto sobre mí."
  }
};

export default registroPersonajes;