# Run in graph-node/docker path
sudo rm -rf data/
docker compose -f docker-compose-1.yml -p service-a up -d
docker compose -f docker-compose-2.yml -p service-b up -d
graph create market --node http://127.0.0.1:8020
graph create market --node http://127.0.0.1:9020
graph deploy market --ipfs http://127.0.0.1:5001 --node http://127.0.0.1:8020
graph deploy market --ipfs http://127.0.0.1:6001 --node http://127.0.0.1:9020