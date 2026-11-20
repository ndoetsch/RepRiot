import type { Card } from '../track'

type Phrase = [phrase: string, meaning: string, hint?: string]

function cards(lang: string, list: Phrase[]): Card[] {
  return list.map(([phrase, meaning, hint]) => ({ title: phrase, body: meaning, hint, say: phrase, lang }))
}

export const SPANISH = cards('es-ES', [
  ['Hola, ¿qué tal?', 'Hi, how are you?'],
  ['Me llamo…', 'My name is…', 'meh YAH-moh'],
  ['Mucho gusto', 'Nice to meet you'],
  ['¿Dónde está el baño?', 'Where is the bathroom?'],
  ['Una cerveza, por favor', 'A beer, please'],
  ['¡Vamos!', "Let's go!"],
  ['Estoy cansado / cansada', "I'm tired"],
  ['¡Una más!', 'One more!'],
  ['¿Cuánto cuesta?', 'How much does it cost?'],
  ['No entiendo', "I don't understand"],
  ['¿Hablas inglés?', 'Do you speak English?'],
  ['Tengo hambre', "I'm hungry", 'literally "I have hunger"'],
  ['¡Qué fuerte!', "How strong! / That's wild!"],
  ['Hasta luego', 'See you later'],
  ['Lo siento', "I'm sorry"],
  ['¿Qué hora es?', 'What time is it?'],
  ['Me encanta', 'I love it'],
  ['Poco a poco', 'Little by little', 'Just like these reps'],
  ['¡Buen trabajo!', 'Good job!'],
  ['Buenas noches', 'Good night'],
])

export const FRENCH = cards('fr-FR', [
  ['Bonjour, ça va ?', 'Hello, how are you?'],
  ['Je m’appelle…', 'My name is…'],
  ['Enchanté', 'Nice to meet you'],
  ['Où sont les toilettes ?', 'Where is the bathroom?'],
  ['Un café, s’il vous plaît', 'A coffee, please'],
  ['Allez !', 'Come on! / Go!'],
  ['Je suis fatigué', "I'm tired"],
  ['Encore une !', 'One more!'],
  ['Combien ça coûte ?', 'How much does it cost?'],
  ['Je ne comprends pas', "I don't understand"],
  ['Vous parlez anglais ?', 'Do you speak English?'],
  ['J’ai faim', "I'm hungry"],
  ['Petit à petit', 'Little by little'],
  ['À plus tard', 'See you later'],
  ['Bravo !', 'Well done!'],
])
