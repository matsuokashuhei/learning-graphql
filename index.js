const { ApolloServer } = require('apollo-server-express')
const expressPlayground = require('graphql-playground-middleware-express').default
const express = require('express')
const { GraphQLScalarType } = require('graphql')

const typeDefs = `
    scalar DateTime
    enum PhotoCategory {
        SELFIE
        PORTRAIT
        ACTION
        LANDSCAPE
        GRAPHIC
    }
    type User {
        githubLogin: ID!
        name: String
        avatar: String
        postedPhotos: [Photo!]!
        inPhotos: [Photo!]!
    }
    type Photo {
        id: ID!
        url: String!
        name: String!
        description: String
        category: PhotoCategory!
        postedBy: User!
        taggedUsers: [User!]!
        created: DateTime!
    }
    input PostPhotoInput {
        name: String!
        category: PhotoCategory=PORTRAIT
        description: String
    }
    type Query {
        totalPhotos: Int!
        allPhotos(after: DateTime): [Photo!]!
    }
    type Mutation {
        postPhoto(input: PostPhotoInput): Photo!
    }
`

var users = [
    { "githubLogin": "mHattrup", "name": "Mike Hattrup" },
    { "githubLogin": "gPlake", "name": "Glen Plake" },
    { "githubLogin": "sSchmidt", "name": "Scot Schmidt" }
]
var photos = [
    {
        "id": "1",
        "name": "Dropping the Heart Chute",
        "description": "The heart chute is one of my favorite chutes",
        "category": "ACTION",
        "githubUser": "gPlake",
        "created": "3-18-1977"
    },
    {
        "id": "2",
        "name": "Enjoying the sunshine",
        "category": "SELFIE",
        "githubUser": "sSchmidt",
        "created": "1-2-1985"
    },
    {
        "id": "3",
        "name": "Gunbarrel 25",
        "description": "25 laps on gunbarrel today",
        "category": "LANDSCAPE",
        "githubUser": "sSchmidt",
        "created": "2018-04-15T19:09:57.308Z"
    }
]
var tags = [
    { "photoID": "1", "userID": "gPlake" },
    { "photoID": "2", "userID": "sSchmidt" },
    { "photoID": "2", "userID": "mHattrup" },
    { "photoID": "2", "userID": "gPlake" },
]

const resolvers = {
    Query: {
        totalPhotos: () => photos.length,
        allPhotos: (parent, args) => photos
    },
    Mutation: {
        postPhoto(parent, args) {
            var newPhoto = {
                id: _id++,
                ...args.input,
                created: new Date()
            }
            console.log(`newPhoto`, JSON.stringify(newPhoto))
            photos.push(newPhoto)
            return newPhoto
        }
    },
    Photo: {
        url: parent => `http://yoursite.com/img/${parent.id}.jpg`,
        postedBy: parent => users.find(user => user.githubLogin === parent.githubUser),
        taggedUsers: parent => tags.filter(tag => tag.photoID === parent.id)
            .map(tag => tag.userID)
            .map(userID => users.find(user => user.githubLogin === userID))
    },
    User: {
        postedPhotos: parent => photos.filter(photo => photo.githubUser === parent.githubLogin),
        inPhotos: parent => tags.filter(tag => tag.userID === parent.id).map(tag => tag.photoID).map(photoID => photos.find(photo => photo.id === photoID))
    },
    DateTime: new GraphQLScalarType({
        name: `DateTime`,
        description: `A valid date time value`,
        parseValue: value => new Date(value),
        serialize: value => new Date(value).toISOString(),
        parseLiteral: ast => ast.value
    })
}

var app = express()
app.get('/', (req, res) => res.end(`Welcome to the PhotoShare API`))
app.get('/playground', expressPlayground({ endpoint: '/graphql' }))
app.listen({ port: 4000 }, () => console.log(`GraphQL server running @ http://localhost:4000${server.graphqlPath}`))

const server = new ApolloServer({ typeDefs, resolvers })
server.applyMiddleware({ app })
