"""
Load gene list data and predictions into a Postgres database.
"""
import argparse
from pred.config import parse_config, CONFIG_FILENAME
from pred.load.download import download_and_convert
from pred.load.loaddatabase import create_sql_pipeline, SqlRunner


def update_progress(message):
    """
    :param message: str message to print out
    """
    print(message)


def run_all_command(config):
    """
    Download, convert and load files in config into the database.
    :param config: pred.Config: global configuration containing what data to download/convert/load.
    """
    download_files_command(config)
    run_sql_command(config)


def download_files_command(config):
    """
    Download, convert files in config.
    :param config: pred.Config: global configuration containing what data to download/convert/load.
    """
    update_progress("STAGE: Downloading files.")
    download_and_convert(config, update_progress)


def run_sql_command(config):
    """
    Load local files into the database based on config.
    :param config: pred.Config: global configuration containing what data to download/convert/load.
    """
    update_progress("STAGE: Creating SQL files.")
    sql_pipeline = create_sql_pipeline(config, update_progress)
    update_progress("STAGE: Executing SQL files.")
    runner = SqlRunner(config, update_progress)
    sql_pipeline.run(runner.execute)
    runner.close()

if __name__ == '__main__':
    funcs = {
        'all': run_all_command,
        'download': download_files_command,
        'run_sql': run_sql_command,
    }
    parser = argparse.ArgumentParser(description='Loads prediction database based on predictionsconf.yaml')
    parser.add_argument('command', choices=funcs.keys())
    args = parser.parse_args()
    funcs[args.command](parse_config(CONFIG_FILENAME))
