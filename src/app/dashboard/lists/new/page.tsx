import ListEditor from "@/components/ListEditor";

export default function NewListPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">New signup list</h1>
      <p className="mt-1 text-sm text-stone-500">
        Set the details, add slots, and choose what questions volunteers answer.
      </p>
      <div className="mt-6">
        <ListEditor />
      </div>
    </div>
  );
}
