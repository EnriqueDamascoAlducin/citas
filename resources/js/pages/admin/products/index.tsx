import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { Service } from '@/types';

type ProductCategory = {
    id: number;
    name: string;
    description: string | null;
};

type ProductItem = {
    id: number;
    name: string;
    description: string | null;
    price: string | number;
    stock: number;
    image: string | null;
    category_id: number | null;
    category: ProductCategory | null;
    active: boolean;
};

interface PageProps {
    products: {
        data: ProductItem[];
        meta: {
            current_page: number;
            last_page: number;
            from: number;
            to: number;
            total: number;
        };
    };
    categories: ProductCategory[];
    filters: {
        search?: string;
        category?: string;
    };
}

export default function ProductsIndex({ products, categories, filters }: PageProps) {
    const [showModal, setShowModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

    function openCreate() {
        setEditingProduct(null);
        setShowModal(true);
    }

    function openEdit(product: ProductItem) {
        setEditingProduct(product);
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        setEditingProduct(null);
    }

    function deleteProduct(product: ProductItem) {
        if (confirm(`¿Eliminar el producto "${product.name}"?`)) {
            router.delete(`/admin/products/${product.id}`);
        }
    }

    return (
        <>
            <Head title="Productos" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <Heading title="Productos" description="Gestiona el inventario de productos" />
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowCategoryModal(true)}>
                            Nueva Categoría
                        </Button>
                        <Button onClick={openCreate}>Nuevo Producto</Button>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="px-4 py-3 text-left font-medium">Nombre</th>
                                <th className="px-4 py-3 text-left font-medium">Categoría</th>
                                <th className="px-4 py-3 text-left font-medium">Precio</th>
                                <th className="px-4 py-3 text-left font-medium">Stock</th>
                                <th className="px-4 py-3 text-left font-medium">Estado</th>
                                <th className="px-4 py-3 text-right font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.data.map((product) => (
                                <tr key={product.id} className="border-b last:border-0">
                                    <td className="px-4 py-3 font-medium">{product.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{product.category?.name ?? '—'}</td>
                                    <td className="px-4 py-3">${Number(product.price).toFixed(2)}</td>
                                    <td className="px-4 py-3">
                                        <span className={
                                            product.stock <= 0 ? 'text-destructive font-medium' :
                                            product.stock <= 5 ? 'text-amber-600 font-medium' : ''
                                        }>
                                            {product.stock}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant={product.active ? 'default' : 'secondary'}>
                                            {product.active ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button variant="outline" size="sm" onClick={() => openEdit(product)}>
                                            Editar
                                        </Button>
                                        <Button variant="destructive" size="sm" className="ml-2" onClick={() => deleteProduct(product)}>
                                            Eliminar
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {products.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                        No hay productos registrados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {products.meta.total > 0 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Mostrando {products.meta.from}-{products.meta.to} de {products.meta.total}</span>
                        <div className="flex gap-2">
                            {Array.from({ length: products.meta.last_page }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    variant={page === products.meta.current_page ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => router.get(`/admin/products?page=${page}`)}
                                >
                                    {page}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Dialog open={showModal} onOpenChange={(open) => { if (!open) closeModal(); }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
                        <DialogDescription>
                            {editingProduct ? 'Actualiza los datos del producto.' : 'Registra un nuevo producto.'}
                        </DialogDescription>
                    </DialogHeader>

                    <Form
                        action={editingProduct ? `/admin/products/${editingProduct.id}` : '/admin/products'}
                        method={editingProduct ? 'patch' : 'post'}
                        onSuccess={() => closeModal()}
                        resetOnSuccess
                        setDefaultsOnSuccess
                    >
                        {({ errors, processing }) => (
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label>Nombre</Label>
                                    <Input name="name" defaultValue={editingProduct?.name ?? ''} />
                                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                </div>

                                <div className="grid gap-2">
                                    <Label>Descripción</Label>
                                    <textarea
                                        name="description"
                                        rows={3}
                                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
                                        defaultValue={editingProduct?.description ?? ''}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Precio ($)</Label>
                                        <Input name="price" type="number" step="0.01" defaultValue={editingProduct?.price ?? 0} />
                                        {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Stock</Label>
                                        <Input name="stock" type="number" defaultValue={editingProduct?.stock ?? 0} />
                                        {errors.stock && <p className="text-sm text-destructive">{errors.stock}</p>}
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Categoría</Label>
                                    <select
                                        name="category_id"
                                        className="border-input bg-background ring-offset-background flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
                                    >
                                        <option value="">Sin categoría</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id} selected={editingProduct?.category_id === cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input id="p_active" name="active" type="checkbox" value="1" defaultChecked={editingProduct?.active ?? true} className="h-4 w-4 rounded border-gray-300" />
                                    <Label htmlFor="p_active">Producto activo</Label>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button>
                                    <Button type="submit" disabled={processing}>
                                        {editingProduct ? 'Actualizar' : 'Crear'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nueva Categoría</DialogTitle>
                        <DialogDescription>Agrega una categoría para clasificar productos.</DialogDescription>
                    </DialogHeader>

                    <Form
                        action="/admin/product-categories"
                        method="post"
                        onSuccess={() => setShowCategoryModal(false)}
                        resetOnSuccess
                    >
                        {({ errors, processing }) => (
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label>Nombre</Label>
                                    <Input name="name" />
                                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label>Descripción (opcional)</Label>
                                    <Input name="description" />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setShowCategoryModal(false)}>Cancelar</Button>
                                    <Button type="submit" disabled={processing}>Crear</Button>
                                </div>
                            </div>
                        )}
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    );
}

ProductsIndex.layout = {
    breadcrumbs: [
        { title: 'Productos', href: '/admin/products' },
    ],
};
