import { Context } from '@azure/functions'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const responseCreator = (context: Context) => (
	status = 200,
	body: string | Record<string, unknown> = ''
) => {
	// eslint-disable-next-line functional/immutable-data, functional/no-expression-statement
	context.res = {
		status,
		body,
	}
}
