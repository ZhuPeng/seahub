# Copyright (c) 2012-2016 Seafile Ltd.
import datetime

from django.db import models


class OnlyOfficeDocKey(models.Model):
    """
    Model used for storing OnlyOffice doc key.
    """
    doc_key = models.CharField(max_length=36, db_index=True)
    username = models.CharField(max_length=255)
    repo_id = models.CharField(max_length=36)
    file_path = models.TextField()
    repo_id_file_path_md5 = models.CharField(max_length=100, db_index=True, unique=True)
    created_time = models.DateTimeField(default=datetime.datetime.now)


REPO_OFFICE_CONFIG = 'office'
class RepoExtraConfig(models.Model):

    repo_id = models.CharField(max_length=36, db_index=True)
    config_type = models.CharField(max_length=50)
    config_details = models.TextField()

    class Meta:
        db_table = 'repo_extra_config'
        unique_together = ('repo_id', 'config_type')
