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

export const GERMAN = cards('de-DE', [
  ['Hallo, wie geht’s?', 'Hi, how are you?', 'VEE gayts'],
  ['Ich heiße…', 'My name is…', 'ish HY-seh'],
  ['Freut mich', 'Nice to meet you', 'FROYT mish'],
  ['Wo ist die Toilette?', 'Where is the bathroom?', 'voh ist dee toy-LET-eh'],
  ['Ein Bier, bitte', 'A beer, please', 'BIT-teh'],
  ['Los geht’s!', "Let's go!", 'lohs GAYTS'],
  ['Ich bin müde', "I'm tired", 'MÜ-deh: say "ee" with rounded lips'],
  ['Noch eine!', 'One more!', 'nokh EYE-neh'],
  ['Wie viel kostet das?', 'How much does it cost?', 'vee FEEL'],
  ['Ich verstehe nicht', "I don't understand", 'fer-SHTAY-eh nisht'],
  ['Sprechen Sie Englisch?', 'Do you speak English?', 'SHPREKH-en zee'],
  ['Ich habe Hunger', "I'm hungry", 'literally "I have hunger"'],
  ['Stark!', 'Strong! / Awesome!', 'shtark'],
  ['Bis später', 'See you later', 'bis SHPAY-ter'],
  ['Entschuldigung', "Sorry / Excuse me", 'ent-SHOOL-dee-goong'],
  ['Wie spät ist es?', 'What time is it?'],
  ['Das gefällt mir', 'I like that', 'geh-FELT meer'],
  ['Schritt für Schritt', 'Step by step', 'Just like these reps'],
  ['Gut gemacht!', 'Well done!', 'goot geh-MAKHT'],
  ['Gute Nacht', 'Good night', 'GOO-teh nakht'],
])
