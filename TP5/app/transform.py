import json

def transform_dataset():
    try:
        with open('../cinema.json', 'r', encoding='utf-8') as f:
            data = json.load(f)

        actors = {}
        genres = {}
        n = 0
        c = 0

        for i, entry in enumerate(data["filmes"], start=1):
            entry["id"] = f"f{i}"

            for actor in entry["cast"]:
                if actor not in actors:
                    actors[actor] = {}
                    actors[actor]["filmes"] = []
                    actors[actor]["id"] = f"a{n}"
                    actors[actor]["name"] = actor
                    n += 1

                actors[actor]["filmes"].append(entry["title"])
            for genero in entry["genres"] :
                if genero not in genres:
                    genres[genero] = {}
                    genres[genero]["filmes"] = []
                    genres[genero]["id"] = f"g{c}"
                    genres[genero]["name"] = genero
                    c += 1
                genres[genero]["filmes"].append(entry["title"])


        db = {
            "filmes": data["filmes"],
            "actors": list(actors.values()),
            "genres": list(genres.values())
        }

        with open("db.json", 'w', encoding='utf-8') as n:
            json.dump(db, n, ensure_ascii=False, indent=4)

        print("done")

    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    transform_dataset()