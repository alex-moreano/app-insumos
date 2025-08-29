import { useState, useEffect } from "react";
import inventoryService from "@/services/InventoryService";
import { Warehouse } from "@/types/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Edit, MapPin, PlusCircle, Search, Trash2, Warehouse as WarehouseIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export default function WarehousePage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [filteredWarehouses, setFilteredWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentWarehouse, setCurrentWarehouse] = useState<Warehouse | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
  });

  useEffect(() => {
    const loadWarehouses = async () => {
      setLoading(true);
      try {
        const data = await inventoryService.getWarehouses();
        setWarehouses(data);
        setFilteredWarehouses(data);
      } catch (error) {
        console.error("Error loading warehouses:", error);
        toast.error("Error al cargar los almacenes");
      } finally {
        setLoading(false);
      }
    };

    loadWarehouses();
  }, []);

  // Search handler
  useEffect(() => {
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      const filtered = warehouses.filter(
        (warehouse) =>
          warehouse.name.toLowerCase().includes(lowerCaseSearch) ||
          warehouse.location.toLowerCase().includes(lowerCaseSearch)
      );
      setFilteredWarehouses(filtered);
    } else {
      setFilteredWarehouses(warehouses);
    }
  }, [searchTerm, warehouses]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      location: "",
      description: "",
    });
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const openEditModal = (warehouse: Warehouse) => {
    setCurrentWarehouse(warehouse);
    setFormData({
      name: warehouse.name,
      location: warehouse.location,
      description: warehouse.description || "",
    });
    setIsEditModalOpen(true);
  };

  const openDeleteDialog = (warehouse: Warehouse) => {
    setCurrentWarehouse(warehouse);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateWarehouse = async () => {
    if (!formData.name || !formData.location) {
      toast.error("Por favor complete los campos requeridos");
      return;
    }

    try {
      const newWarehouse = await inventoryService.createWarehouse({
        name: formData.name,
        location: formData.location,
        description: formData.description,
        isActive: true
      });
      
      setWarehouses((prev) => [...prev, newWarehouse]);
      toast.success("Almacén creado correctamente");
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error creating warehouse:", error);
      toast.error("Error al crear el almacén");
    }
  };

  const handleUpdateWarehouse = async () => {
    if (!currentWarehouse || !formData.name || !formData.location) {
      toast.error("Por favor complete los campos requeridos");
      return;
    }

    try {
      const updatedWarehouse = await inventoryService.updateWarehouse(
        currentWarehouse.id,
        {
          name: formData.name,
          location: formData.location,
          description: formData.description,
        }
      );

      if (updatedWarehouse) {
        setWarehouses((prev) =>
          prev.map((w) => (w.id === currentWarehouse.id ? updatedWarehouse : w))
        );
        toast.success("Almacén actualizado correctamente");
        setIsEditModalOpen(false);
      }
    } catch (error) {
      console.error("Error updating warehouse:", error);
      toast.error("Error al actualizar el almacén");
    }
  };

  const handleToggleWarehouseStatus = async () => {
    if (!currentWarehouse) return;

    try {
      const updatedWarehouse = await inventoryService.updateWarehouse(
        currentWarehouse.id,
        { isActive: !currentWarehouse.isActive }
      );

      if (updatedWarehouse) {
        setWarehouses((prev) =>
          prev.map((w) => (w.id === currentWarehouse.id ? updatedWarehouse : w))
        );
        
        toast.success(
          updatedWarehouse.isActive
            ? "Almacén activado correctamente"
            : "Almacén desactivado correctamente"
        );
        
        setIsDeleteDialogOpen(false);
      }
    } catch (error) {
      console.error("Error toggling warehouse status:", error);
      toast.error("Error al cambiar el estado del almacén");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Gestión de Bodegas
        </h2>
        <p className="text-muted-foreground">
          Administre los almacenes y bodegas del sistema
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar almacenes..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={openCreateModal} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Almacén
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2">Cargando almacenes...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredWarehouses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <WarehouseIcon className="h-8 w-8 mb-2" />
                    <h3 className="font-medium">No se encontraron almacenes</h3>
                    <p>Cree un nuevo almacén</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredWarehouses.map((warehouse) => (
                <TableRow key={warehouse.id}>
                  <TableCell className="font-medium">{warehouse.name}</TableCell>
                  <TableCell className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" /> {warehouse.location}
                  </TableCell>
                  <TableCell>{warehouse.description || "-"}</TableCell>
                  <TableCell className="text-center">
                    {warehouse.isActive ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-rose-50 text-rose-700 hover:bg-rose-50">
                        Inactivo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(warehouse)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(warehouse)}
                        className={warehouse.isActive ? "text-red-500 hover:text-red-600 hover:bg-red-50" : "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Warehouse Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Almacén</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Ubicación
              </Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descripción
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="Descripción opcional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateWarehouse}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Warehouse Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Almacén</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Nombre
              </Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-location" className="text-right">
                Ubicación
              </Label>
              <Input
                id="edit-location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Descripción
              </Label>
              <Textarea
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="Descripción opcional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateWarehouse}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toggle Status Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {currentWarehouse?.isActive
                ? "¿Desactivar almacén?"
                : "¿Activar almacén?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {currentWarehouse?.isActive
                ? "Esta acción desactivará el almacén y no estará disponible para nuevos movimientos. Esta acción no elimina ningún dato histórico."
                : "Esta acción activará el almacén y estará disponible para nuevos movimientos."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleWarehouseStatus}
              className={currentWarehouse?.isActive ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}
            >
              {currentWarehouse?.isActive ? "Desactivar" : "Activar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}