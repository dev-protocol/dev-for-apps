import { CosmosClient, Container, ItemResponse } from '@azure/cosmos'

export type Tag = {
	readonly name: string
}

const COSMOS = {
	database: 'Stakes.social',
	container: 'Tag',
}

export const createDBInstance = async (
	Client: typeof CosmosClient,
	opts: {
		readonly database: string
		readonly container: string
	},
	env: NodeJS.ProcessEnv
): Promise<Container> => {
	const { DB_ENDPOINT: endpoint = '', DB_MASTER_KEY: key = '' } = env
	const client = new Client({ endpoint, key })
	const { database } = await client.databases.createIfNotExists({
		id: opts.database,
	})
	const { container } = await database.containers.createIfNotExists({
		id: opts.container,
	})
	return container
}

export const writer = (client: typeof CosmosClient) => async (
	data: Tag
): Promise<ItemResponse<Tag>> => {
	const container = await createDBInstance(client, COSMOS, process.env)
	return container.items.upsert<Tag>(data)
}

export const reader = (client: typeof CosmosClient) => async (
	name: string
): Promise<ItemResponse<Tag>> => {
	const container = await createDBInstance(client, COSMOS, process.env)
	return container.item(name).read()
}

export const existTag = (client: typeof CosmosClient) => async (
	name: string
): Promise<boolean> => {
	return reader(client)(name) !== null
}
