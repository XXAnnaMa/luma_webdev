import subprocess

import typer
import uvicorn

app = typer.Typer(help="Developer CLI for the Luma FastAPI scaffold.")


@app.command()
def run(host: str = "0.0.0.0", port: int = 8000, reload: bool = True) -> None:
    """Run the FastAPI app with Uvicorn."""
    uvicorn.run("luma.main:app", host=host, port=port, reload=reload)


@app.command("db-upgrade")
def db_upgrade(revision: str = "head") -> None:
    """Upgrade database schema to a revision."""
    subprocess.run(["alembic", "upgrade", revision], check=True)


@app.command("db-downgrade")
def db_downgrade(revision: str) -> None:
    """Downgrade database schema to a revision."""
    subprocess.run(["alembic", "downgrade", revision], check=True)


@app.command("db-revision")
def db_revision(message: str, autogenerate: bool = True) -> None:
    """Create a new Alembic revision."""
    cmd = ["alembic", "revision", "-m", message]
    if autogenerate:
        cmd.append("--autogenerate")
    subprocess.run(cmd, check=True)


if __name__ == "__main__":
    app()
