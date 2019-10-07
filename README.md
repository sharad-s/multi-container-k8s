# Multi-Container Docker App
[![Build Status](https://travis-ci.org/sharad-s/multi-container-docker.svg?branch=master)](https://travis-ci.org/sharad-s/multi-container-docker)



# K8s

## ClusterIP Service?

 - What is clusterIP 

## ClusterIP Service?

 - What is clusterIP 
 - NodePort vs ClusterIP
    - NodePort allows  
    - ClusterIP allows any other Object to access the Object that the ClusterIP is pointing at.
    - Allows a Cluster of Pods to access 
    - Use ClusterIPS anytime you have an object that needs to be accessible any place within the Node.

 
## ClusterIP config File

- only has port and targetPort
- if port is `3050` then other pods interanlly need to access this Pod through that port
- Usually no sense to keep port and targetPort different. 
- keep `targetPort` and `port` the same

- `spec`
 - `spec.type`
 - `spec.selector`
 - `spec.ports`

## Applying multiple files with KubeCTL
 - Delete existing deployments/pods/services
 - Apply the entire folder
    - `kubectl apply -f <folder_path>`


## Express API deployment Config
 - ClusterIP accessed by port 5000, forwards traffic to API pods at port 5000
     - `targetPort: 5000`, `port: 5000`

## Combining Config into Single Files

 - One single file can hold all the config for each deployment
 - Consolidate the Cluster-IP-Service and the Deployment into one file
    - `server-config.yml`
        - Contains all of server-deployment.yml and server-cluster-ip.yml
        - separate each config with `---`
 - Makes more sense to tie each config to a file




## Worker Container
 - no container will directly access multi-worker, thus it needs no Port or Service assigned to it


 ## The need for for Volumes with Databses
  - PVC - Persistent Volume Claim
  - Volumes share filesystem of local machine to fs inside container
  - Postgres Deployment ( Pod (Postgres Container ( <filesystem> )))

  - If your pod EVER gets deleted (crash, etc) - then the entire filesystem gets lost!
    - Without Volumes, there won't be a way to carry over the data to the new Pod

    - Volumes run on host machine, Postgres container thinks it's inside its filesystems. 
    - If a Postgres container crashes, the new one will just reference the volume created on the host machine

    - If you create 2+ replicas of a Postgres container referencing just 1 volume, that's a recipe for disaster. Don't do this

    - 

## Kubernetes Volumes
"Volume" in generic container terms: Some type of mechanism that allows a container to access a filesystem outside itself

"Volume" in Kubernetes: An **object** that allows a container to store data at the pod level    
    - Data storage pocket that belongs to a Pod
    - if a pod dies, then the volume dies with it


"Persistent Volume": 
 - Long term durable storage not tied to any pod or any storage
 - If a pod gets deleted or recreated entirely, the Persistent Volume still exists and the newly created Pod will be able to access the Persistent Volume

 "Persistent Volume Claims"
  - We have a pod that needs a persistent volume
  - Persistent Volume Claim is an advertisement (not an actual volume) for specific options of storage inside a cluster
  - YOu can ask for oen of those options inside your pod config

  Statically Provisioned Persistent Volume - created ahead of time 
  Dynamically Provisioned - created just in time as you request it


  ## Persistent Volume Claim Config Files
    - Volume claim is something you attach to your pod config

    Access Modes
     - ReadWriteOnce - Single node can read and write
     - ReadOnlyMany - Multiple nodes can read at the same time
    - ReadWriteMany - Many nodes can read and write at teh same time 

    If you attach this PVC to your pod, kuberenetes will have to find an instance of storage that supports the specified access mode

## Where does K8s allocate persistent volume?
 - Default is a slice of your hard drive - k8s slices from your hard drive 
 - you can set the default
    - `kubectl get storageclass`
        - standard (default)
        - provisioner: minkube/hospath
    - `kubectl describe storageclass`
        - show
- this is really easy in local - k8s usually always uses your hard drive

- this multiplies in complexity when hosting in the cloud, because when you create a Volume CLaim, k8s has a bunch of options for creating persistent volumes from. 

- on Cloud
    - default is GC Persistent Disk or AWS Bloc Store, usually these defaults are okay

## Designing a PVC - Revisiting Postgres Deplyment config

 - in the same indentation level as `spec:containers`, add `spec:volumes`
    - `spec:volumes:name` defines the name of this volume
    - `spec:volumes:persistentVolumeClaim` starts a PVC definition
        - claimName: refers to the name of the PVC in its own config file : `database-persistent-volume-claim`

- inside `spec:containers`, add `spec:containers: volumeMounts`to each container which will use the volume.
    - `name: postgres-storage` - define the volume by its metadata name
    - `mountPath: /var/lib/postgresql/data` - that's where the data is on the hard drive?
    - `subpath:postgres`: additional option for postgres only - it means any data tthat's stored inside the mountPath, will be stored on the volume in folder postgres

- you're attaching a persistentVolumeClaim definition to a pod spec

- once you attach it via volumes, you must attach it it to the container (here's how I want it to be used in my container)

## Applying a PVC
 - `kubectl apply -f k8s/`
 - `kubectl get pv`
 - `kubectp get pvc`

## Defining Environment Vars
 - the URL of any ClusterIP service needs only to be the NAME of that ClusterIP service
    - `REDIS_HOST = redis-cluster-ip-service`

## Adding ENV VARS to configs
 - `spec:containers:env` will be an array containing
    - `name` var name
    - `value` var value


 - Creating an Encoded secret VAR
    - new type of Object - Secret
        - securely store 1+ piece of info inside your cluster

 - Secret is an Object
    - use an imperative command
    - must be done manually
    - `kubectl create secret generic <secret_name>  --from-literal key=value`
    - generic -> generic/ docker-registry / tls
    - one secret <secret_name> can hold many key value pairs
    - `kubectl get secrets`


## Passing Secrets as Env Vars
- name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: pgpassword
                  key: PGPASSWORD


## Handling Traffic with Ingress Controllers
 - DIfferent types of Ingresses
    - We're using an NGinx ingress

    - We are using **ingress-nginx**, a community-led project

    - We are *not* using **kubernetes-ingress**, a project led by the company nginx


- Setup of ingress-nginx changes depends on your environmnet( local, GC, AWS, Azure) - we will set up ingress-nginx on local and GC

- Deployment is a type of "controller". A "controller" is something that works tha mke sure the desired state is achieved. We'll be writing an Ingress "controller"

Ingress Config -> Ingress Controller -> Thing that Routes traffic -> Services

In our Case, we'll be using Nginx Ingress
Ingress Config -> Ingress Controller + Thing that Routes Traffic(Same thing here) -> Services


## Load Balancer Services
 - Legacy way of getting network traffic into a cluster 
 - (Outdated) - Use Ingress Service
 - Type Service subType LoadBalancer
 - Load Balancer will only give oyu access to one set of pods
    - k8s will reach out to your cloud provider and create a load balancer using their own definition of what a load balancer is - then connect to your pod inside
 - Use an Ingress service instead 


 ## Behind the scenes Ingress

Traffic -> Google Cloud Load Balancer -> (Load Balancer Service (Ingress Controller and Nginx Pod) created by Ingress Config -> Services)

WHen you set an INgress
 - A Default-Backend Pod is created in your cluster

Why use ingress-nginx? 
 - Extra code added for utility: ie
 Sticky Sessions
  - Nginx-pod routes request directly to one of these pods
  - One user sends two reqeusts to that app, then it goes to the same server
  
Just in case you wanted to understand ingress-nginx a bit better, check out this article by Hongli Lai - https://www.joyfulbikeshedding.com/blog/2018-03-26-studying-the-kubernetes-ingress-system.html.  Hongli is an absolute genius, he co-created Phusion Passenger, an extremely popular webserver that integrates with Nginx. 

## Setting up Ingress-Nginx locally with minikube
https://kubernetes.github.io/ingress-nginx/deploy/#prerequisite-generic-deployment-command

Need to execute mandatory command
`kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/master/deploy/static/mandatory.yaml`

Then execute command
`minikube addons enable ingress`

this config file has a bunch of shit to understand :/ 
- starts a copy of nginx but also has a bunch of config for how to customize this nginx image
- sets up default backup api


## Setting up Ingress with Docker's Desktop Kubernetes
N/a

## Creating Ingress Config
NGINX Routing Rules: Traffic -> Path -> Route based on path

`ingress-service.yaml`

New metadata field
`metadata:annotations`: HIgher level config around Ingress object
    - `kubernetes.io/ingress.class: nginx`
    - `nginx.ingress.kubernetes.io/rewrite-target: /`

Rewrite target is like nginx rewriting /api 

Ingress spec
`spec: rules`
 - `spec:rules:http:paths` has path objects
    - each path is configured as
        - `path:/`
        - `backend:`
            - `backend: serviceName:client-cluster-ip-service`
            - `backend: servicePort:3000`

In the previous lecture we created our ingress-service.yaml configuration file. There has recently been an update to how we need to specify some of these rules.

Three lines need to be changed - the annotation of rewrite-target and the two path identifiers:
```yaml
    apiVersion: extensions/v1beta1
    kind: Ingress
    metadata:
      name: ingress-service
      annotations:
        kubernetes.io/ingress.class: nginx
        nginx.ingress.kubernetes.io/rewrite-target: /$1
        # UPDATE THIS LINE ABOVE
    spec:
      rules:
        - http:
            paths:
              - path: /?(.*)
              # UPDATE THIS LINE ABOVE
                backend:
                  serviceName: client-cluster-ip-service
                  servicePort: 3000
              - path: /api/?(.*)
              # UPDATE THIS LINE ABOVE
                backend:
                  serviceName: server-cluster-ip-service
                  servicePort: 5000
```

## Testing Ingress Locally

`minikube ip`

When you go here, you'll see the certificate is insecure in development
Base ingress controller uses a fake certificate

We'll fix this in production. IN dev you can just let this sit

## Minikube Dashboard
 - command `minikube dashboard`
 

## Bugs I ran into
 - React frontend kept erroring out due to lack of error handling on frontend. Since it was production the page would just crash
    - I fixed the issue on frontned and pushed a new image to dockerhub. then i force updated the image through kubetcl

 - Frontend would submit to backend but could not pull 
    - checked logs on server - Postgres connectionwas erroring out - looked like connection wasn't being made
    - I checked the ENV Vars for server - 
    - The PGHOST was connected to `postgres-cluster-ip-service` but the Cluster IP Service for postgres was actually named `postgres-cluster-ip`. Therefore server could not connect to PGHOST. I changed the name to `postgres-cluster-ip-service` in the config file.

    - I expected this to work but it didn't. THe old server pods were still up when I applied configurations because the server deployment config files weren't changed. What I did was reorder the config file to "update" the config. Then updating the entire config file resulted in a Deployment update for the server. now it works. I could have also "force updated" with the config file instead of making a change to the config file to update it. 

    
- Seen Indexs from PG weren't showing inclient
  - ultimately it was a rednering bug on the client i created. I fixed it, pushed new image, force updated image on config, then issue went away
