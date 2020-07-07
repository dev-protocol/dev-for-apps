import { CosmosClient, Container, ItemResponse } from '@azure/cosmos'

export type User = {
	readonly id: string // key is address
	readonly addressName: string
}

const COSMOS = {
	database: 'Stakes.social',
	container: 'User',
}

const createDBInstance = async (
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
	data: User
): Promise<ItemResponse<User>> => {
	const container = await createDBInstance(client, COSMOS, process.env)
	return container.items.upsert<User>(data)
}

export const reader = (client: typeof CosmosClient) => async (
	id: string
): Promise<ItemResponse<User>> => {
	const container = await createDBInstance(client, COSMOS, process.env)
	return container.item(id).read()
}
