'use strict'

const { sanitizeEntity } = require('strapi-utils')

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
	async all(_) {
		const entities = await strapi.services.tag.find()

		return entities.map((entity) => {
			const e = { id: entity.id, name: entity.name }
			return sanitizeEntity(e, { model: strapi.models.tag })
		})
	},
}
