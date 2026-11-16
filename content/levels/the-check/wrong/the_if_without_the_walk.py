brooms = wizard.find_all("broom")
for broom in brooms:
    if broom.knotted:
        broom.untie()
