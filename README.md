# ANiq - A scalable distinct value estimation system.
Get a cardinality of a set, multiple set unions and intersections!

### WARNING! Highly experimental. Use at your own risk!

## INTRO

To see what problem ANiq is tackling, please read [ANiq — counting distinct values at scale](https://medium.com/@drainingsun/aniq-counting-distinct-values-at-scale-6d8c99485adf)

## REQUIREMENTS
* Node.js v6+
* Redis v4+

## INSTALLATION
`npm install aniq`

## CONFIGURATION

Copy `sample.json` to `production.json`. Modify per your settings.

## RUNNING

* `cd node_modules/aniq/`  
* `NODE_ENV=production node app.js`

## PRODUCTION USAGE
 
1. For making ANiq scalable and stable it is recommended to use a process manager such as PM2.
2. For best performance put ANiq behind a reverse proxy with proper load balancing (i.e. Nginx).  

## API

### Add

Add a member to KMV

**URL** : `/add/:key/`

**URL Parameters** : `key=[string]` where `key` is a name of the KMV.

**Method** : `PUT`

**Data constraints**

```json
[
    "[string]",
    "[string]",
    "...etc"
]
```

**OR**

`[string]`

**Data example** As an array or string

```json
[
    "Canada",
    "US",
    "Mexico"
]
```

**OR**

```text
Canada
```

#### Success Response

**Condition** : If key and at least one member is provided.

**Code** : `200 OK`

**Content example**

```json
{
    "result": "OK"
}
```

#### Error Responses

**Condition** : If no member value is provided

**Code** : `400 BAD REQUEST`

**Content** : 

```json
{
    "code": "api-2",
    "message": "Members parameter should either be a string or an array of strings"
}
```

**OR**

**Condition** : If no key is provided.

**Code** : `404 NOT FOUND`

**Content** :

```json
{"code": "ResourceNotFound"}
```

### Cardinality

Return the cardinality of a KMV

**URL** : `/cardinality/:key/`

**URL Parameters** : `key=[string]` where `key` is a name of the KMV.

**Method** : `GET`

#### Success Response

**Condition** : If key is provided.

**Code** : `200 OK`

**Content example**

```json
{
    "result": "[int]"
}
```

#### Error Responses

**Condition** : If no key is provided.

**Code** : `404 NOT FOUND`

**Content** :

```json
{"code": "ResourceNotFound"}
```

### Union

Return the cardinality of a multiple KMV union.

**URL** : `/union/:keys/`

**URL Parameters** : `keys=[string,]` where `keys` is comma separated names of the KMVs.

**Method** : `GET`

#### Success Response

**Condition** : If two or more keys are provided.

**Code** : `200 OK`

**Content example**

```json
{
    "result": "[int]"
}
```

#### Error Responses

**Condition** : If no key is provided.

**Code** : `404 NOT FOUND`

**Content** :

```json
{"code": "ResourceNotFound"}
```

**OR**

**Condition** : If only one key is provided

**Code** : `400 BAD REQUEST`

**Content** : 

```json
{
    "code": "api-3",
    "message": "Keys parameter should be an array of two or more key strings"
}
```

### Intersection

Return the cardinality of a multiple KMV intersection.

**URL** : `/union/:keys/`

**URL Parameters** : `keys=[string,]` where `keys` is comma separated names of the KMVs.

**Method** : `GET`

#### Success Response

**Condition** : If one or more keys are provided.

**Code** : `200 OK`

**Content example**

```json
{
    "result": "[int]"
}
```

#### Error Responses

**Condition** : If no key is provided.

**Code** : `404 NOT FOUND`

**Content** :

```json
{"code": "ResourceNotFound"}
```

**OR**

**Condition** : If only one key is provided

**Code** : `400 BAD REQUEST`

**Content** : 

```json
{
    "code": "api-3",
    "message": "Keys parameter should be an array of two or more key strings"
}
```

## Scaling
* To scale the app itself - add more Node.js clients
* To scale Redis servers - add more of those
* To scale Redis processes - add more per server

Sample architecture is as follows:

```text
r1  r2  r3  r4    r5  r6  r7  r8 (redis instances)
      s1                s2       (redis servers)
               f1                (client)
```
s1, s2 and f1 can be on the same server. r1-r4 and r5-r8 should be on separate servers.  
s1, s1 and f1 should be two or more identical servers to remove single point of failure.  
f1 has a replication factor and writePolicy of 2. If you don't want replication or are using Redis standard one, you can
disable this via config.

## Testing
NOTE: Requires Redis (localhost and ports 6379-6832) to be installed (4 instances for full testing)

Copy `sample.json` to `testing.json`. Modify per your settings.

```bash
npm test
```

## Linting
```bash
npm run lint
```

## Contributing
Go nuts! Just don't forget to test and lint. Credit will be given where it's due.

## Future
* Benchmarks
* Lots of fixes and optimizations