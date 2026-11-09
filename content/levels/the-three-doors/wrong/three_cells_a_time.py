for step in range(3):
    door = wizard.find_nearest("door")
    door.open()
    wizard.move_up(3)
