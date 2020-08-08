import {
	CosmosClient,
	Container,
	FeedResponse,
	ItemResponse,
} from '@azure/cosmos'

export type PropertyTags = {
	readonly id: string // property address
	// eslint-disable-next-line functional/no-mixed-type
	readonly tags: readonly string[]
}

const COSMOS = {
	database: 'Stakes.social',
	container: 'PropertyTags',
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
	data: PropertyTags
): Promise<ItemResponse<PropertyTags>> => {
	// ignore empty string
	const writeData = {
		...data,
		tags: data.tags.filter((t: string) => t !== ''),
	}

	const container = await createDBInstance(client, COSMOS, process.env)
	return container.items.upsert<PropertyTags>(writeData)
}

export const reader = (client: typeof CosmosClient) => async (
	id: string
): Promise<ItemResponse<PropertyTags>> => {
	const container = await createDBInstance(client, COSMOS, process.env)
	return container.item(id).read()
}

export const getAllPropertiesByTag = (client: typeof CosmosClient) => async (
	tag: string
): Promise<FeedResponse<PropertyTags>> => {
	const container = await createDBInstance(client, COSMOS, process.env)
	return container.items
		.query<PropertyTags>({
			query:
				'SELECT p.id, p.tags FROM PropertyTags p WHERE ARRAY_CONTAINS(p.tags, @p1)',
			parameters: [{ name: '@p1', value: tag }],
		})
		.fetchAll()
}

export const countAllPropertiesByTag = (client: typeof CosmosClient) => async (
	tag: string
): Promise<number> => {
	const container = await createDBInstance(client, COSMOS, process.env)
	return container.items
		.query<number>({
			query:
				'SELECT VALUE COUNT(p.id) FROM PropertyTags p WHERE ARRAY_CONTAINS(p.tags, @p1)',
			parameters: [{ name: '@p1', value: tag }],
		})
		.fetchAll()
		.then((r) => {
			return r.resources[0]
		})
}
