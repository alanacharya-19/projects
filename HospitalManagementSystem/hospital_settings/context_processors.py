from hospital_settings.models import HospitalSettings


def hospital_settings(request):
    return {'hospital': HospitalSettings.get_settings()}
