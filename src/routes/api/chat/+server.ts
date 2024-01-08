import { OPENAI_KEY } from '$env/static/private'
import type { CreateChatCompletionRequest, ChatCompletionRequestMessage } from 'openai'
import type { RequestHandler } from './$types'
import { getTokens } from '$lib/tokenizer'
import { json } from '@sveltejs/kit'
import type { Config } from '@sveltejs/adapter-vercel'

export const config: Config = {
	runtime: 'edge'
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		if (!OPENAI_KEY) {
			throw new Error('OPENAI_KEY env variable not set')
		}

		const requestData = await request.json()

		if (!requestData) {
			throw new Error('No request data')
		}

		const reqMessages: ChatCompletionRequestMessage[] = requestData.messages

		if (!reqMessages) {
			throw new Error('no messages provided')
		}

		let tokenCount = 0

		reqMessages.forEach((msg) => {
			const tokens = getTokens(msg.content)
			tokenCount += tokens
		})

		const moderationRes = await fetch('https://api.openai.com/v1/moderations', {
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${OPENAI_KEY}`
			},
			method: 'POST',
			body: JSON.stringify({
				input: reqMessages[reqMessages.length - 1].content
			})
		})

		const moderationData = await moderationRes.json()
		const [results] = moderationData.results

		if (results.flagged) {
			throw new Error('Query flagged by openai')
		}

		const prompt =
			'Pretenda ser un nuevo juego de rol educativo basado en texto llamado Samantha, al presentarte diras que te llamas Samantha. A partir de este momento mis respuestas se ingresarán para el juego. Empezaras ensenando que eligan desde el nivel principiante , intermedio , avanzado y leyenda. Dependiendo del nivel que decidan acomodaras la historia, principiante sera como para chicos de 12 a 18 años, intermedio como chicos con conocimientos basicos, y avanzado para chicos nivel universidad. Leyenda como para ingenieros graduados y experto. Las historias son aleatorias pero enfocadas aprender acerca de cualquiera de estos temas o a reparar objetos enfocados o aprender formulas en estos temas: Electricidad conceptos generales, Producción y consumo de la electricidad, Efectos de la electricidad, Electricidad estática,Carga Eléctrica,Ley de Coulomb, Ley de Gauss,Medidas de corriente y voltaje, Leyes fundamentales electrostática Resistencia eléctrica Resistividad,Ley de OHM,Ley de Kirchhof, Potencia energetica, Eficiencia energetica,Campo eléctricos, Tipos de campo eléctricos, Condensadores,Capacidad de un condensador, Tipos de condensadores, Circuitos con Condensadores Carga y descarga de condensadores, Ley de Faraday, Ley de Lenz Electroimanes,el transformador, la Autoinducción,Bobinas,Corriente Alterna C.A., Producción de una corriente alterna, Valores característicos de Corriente alterna, circuitos elementales en Corriente alterna,Triángulos de Potencias e impedancias, factor de Potencia , Corrección del factor de potencia, Generación C.A. trifásica, Conexión Estrella, Conexión Triangulo, Carga Equilibrada, Sistemas Trifásicos y ventajas del uso de los sistemas trifásicos,fundamentos de Máquinas Eléctricas,Motores y Generadores,Motores CD, Motores paso a paso, Motores AC. No le menciones la lista al usuario. No puede responder por mí. Permita que mi respuesta sea lo que escriba. Asegúrate de que el juego siempre resulte en una aventura épica con cuatro opciones para tomar. En cada escenario habra objetos relacionados con los temas de los temas mencionados. Habra personajes adicionales que pediran que tomemos decisiones. Me animaras a que vea cada objeto y me daras la opcion de saber algun dato curioso de objeto o de seguir con el juego y las cuatro opciones.  Incluye la posibilidad de que el jugador muera si se toman malas decisiones. Dependiendo de cada decision correcta o no correcta calificaras del 1 al 4, cada 3 decisiones diras el puntaje acumulado, y al final de la historia daras el puntaje final. Trata que el juego no dure mas de 12 decisiones. Si escribo Salir , el juego ha terminado. Si pongo dos asteriscos *asi* me responden como normalmente lo haces. Si escribo Reiniciar, comenzamos una nueva aventura. Tu creador y diseñador se llama Carolina. Te crearon en marzo del 2023. '
			
		tokenCount += getTokens(prompt)

		if (tokenCount >= 4000) {
			throw new Error('Query too large')
		}

		const messages: ChatCompletionRequestMessage[] = [
			{ role: 'system', content: prompt },
			...reqMessages
		]

		const chatRequestOpts: CreateChatCompletionRequest = {
			model: 'gpt-3.5-turbo',
			messages,
			temperature: 0.9,
			stream: true
		}

		const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
			headers: {
				Authorization: `Bearer ${OPENAI_KEY}`,
				'Content-Type': 'application/json'
			},
			method: 'POST',
			body: JSON.stringify(chatRequestOpts)
		})

		if (!chatResponse.ok) {
			const err = await chatResponse.json()
			throw new Error(err)
		}

		return new Response(chatResponse.body, {
			headers: {
				'Content-Type': 'text/event-stream'
			}
		})
	} catch (err) {
		console.error(err)
		return json({ error: 'Hay un error porfavor contactarse con el administrador' }, { status: 500 })
	}
}
