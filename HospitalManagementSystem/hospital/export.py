"""Shared CSV export helper for list views."""
import csv

from django.http import HttpResponse


def csv_response(filename, headers, rows):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    writer = csv.writer(response)
    writer.writerow(headers)
    for row in rows:
        writer.writerow([str(cell) if cell is not None else '' for cell in row])
    return response
