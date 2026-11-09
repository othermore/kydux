for step in range(2):
    door = wizard.find_nearest("door")
    door.open()
    wizard.move_up(4)
